import time
import json
import logging
import redis
from threading import Thread, Event
from paho.mqtt.client import Client
from .protocol_router import ProtocolRouter

BROKER = "localhost"
PORT = 1883
RETRY_INTERVAL = 10  # seconds

logger = logging.getLogger('omnisyslogger')

class BaseNode:
    def __init__(self, object_id, broker=BROKER, port=PORT):
        self.object_id = object_id
        self.broker = broker
        self.port = port

        self.client = None
        self._thread = None

        # Redis client
        self.redis = redis.Redis(host="localhost", port=6379, db=1)
        self._retry_stop_event = Event()
        self._retry_thread = Thread(target=self._periodic_retry_loop, daemon=True)

        self.connect()

    def start(self):
        if not self._thread:
            self._thread = Thread(target=self.client.loop_start, daemon=True)
            self._thread.start()
        if not self._retry_thread.is_alive():
                self._retry_thread.start()

    def stop(self):
        self._retry_stop_event.set()
        if self.client:
            self.client.disconnect()
            self.client.loop_stop()
        logger.info(f"[Object: {self.object_id}] MQTT client disconnected and loop stopped.")

    def send_message(self, destination, protocol, msg_type, payload):
        envelope = {
            "protocol": protocol,
            "type": msg_type,
            "source": self.object_id,
            "destination": destination,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "payload": payload,
        }
        topic = f"comm/{destination}"
        try:
            result = self.client.publish(topic, json.dumps(envelope))
            if result.rc != 0:
                raise Exception(f"MQTT publish failed, rc={result.rc}")
        except Exception as e:
            logger.warning(f"MQTT send failed, buffering message: {e}")
            self.redis.lpush(f"buffer:{self.object_id}:{destination}", json.dumps(envelope))

    def on_message(self, client, userdata, msg):
        message = json.loads(msg.payload.decode())
        self.handle_message(message)

    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            decoded = handler.decode(message['payload'])
            logger.info(f"[Object: {self.object_id}] Got {message['protocol']} message: {decoded}")
        else:
            logger.info(f"[Object: {self.object_id}] Received message: {message}")

    def shutdown(self):
        self.stop()

    def connect(self):
        """Connect to EMQX broker with no authentication."""
        self.client = Client(client_id=self.object_id)
        self.client.user_data_set(self)
        self.client.on_message = self.on_message
        result = self.client.connect(self.broker, self.port, 60)
        if result != 0:
            raise Exception("MQTT connection failed")
        self.client.subscribe(f"comm/{self.object_id}")

    def retry_buffered_messages_all(self):
        """Retry all buffered messages for this node, for all destinations."""
        pattern = f"buffer:{self.object_id}:*"
        for key in self.redis.scan_iter(pattern):
            parts = key.decode().split(":")
            if len(parts) == 3:
                destination = parts[2]
                self._retry_single_destination(destination)

    def _retry_single_destination(self, destination):
        key = f"buffer:{self.object_id}:{destination}"
        while True:
            msg_json = self.redis.rpop(key)
            if not msg_json:
                break
            try:
                result = self.client.publish(f"comm/{destination}", msg_json)
                if result.rc != 0:
                    raise Exception("MQTT publish failed during retry")
            except Exception as e:
                logger.warning(f"Retry failed for {destination}, re-buffering message: {e}")
                self.redis.lpush(key, msg_json)
                break  # Stop if broker is down

    def _periodic_retry_loop(self):
        while not self._retry_stop_event.is_set():
            self.retry_buffered_messages_all()
            time.sleep(RETRY_INTERVAL)
