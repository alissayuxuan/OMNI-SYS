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
    """
    Base class for all communication nodes
    This class handles MQTT connection, message sending, receiving, and retrying buffered messages.
    It uses Redis for buffering messages when the broker is down.
    """
    def __init__(self, object_id, broker=BROKER, port=PORT):
        """Initialize the BaseNode with an object ID, broker address, and port."""
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
        """Start the MQTT client loop and retry thread."""
        if not self._thread:
            self._thread = Thread(target=self.client.loop_start, daemon=True)
            self._thread.start()
        if not self._retry_thread.is_alive():
                self._retry_thread.start()

    def stop(self):
        """Stop the MQTT client loop and retry thread."""
        self._retry_stop_event.set()
        if self.client:
            self.client.disconnect()
            self.client.loop_stop()
        logger.info(f"[Object: {self.object_id}] MQTT client disconnected and loop stopped.")

    def send_message(self, destination, protocol, msg_type, payload):
        """Send a message to a destination using MQTT."""
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
            logger.info(f"[{self.object_id}] Published to {topic}")
            if result.rc != 0:
                raise Exception(f"MQTT publish failed, rc={result.rc}")
        except Exception as e:
            logger.warning(f"MQTT send failed, buffering message: {e}")
            self.redis.lpush(f"buffer:{self.object_id}:{destination}", json.dumps(envelope))

    def on_message(self, client, userdata, msg):
        """
        Callback for incoming messages.
        Decodes the message payload and routes it to the appropriate handler.
        """
        payload_raw = msg.payload.decode()
        print(f"\n📩 [RECEIVED] Topic: {msg.topic}")
        print(f"📦 Payload (raw): {payload_raw}")
        try:
            message = json.loads(payload_raw)
            print(f"📦 Payload (parsed):\n{json.dumps(message, indent=2)}")
            self.handle_message(message)
        except Exception as e:
            print(f"❌ Failed to parse JSON: {e}")
            logger.error(f"Error decoding message: {e}")

    def handle_message(self, message):
        """
        Handle incoming messages by decoding the payload based on the protocol.
        Uses ProtocolRouter to get the appropriate handler for the protocol.
        """
        protocol = message.get('protocol')
        handler = ProtocolRouter.get_handler(protocol)
        if handler:
            decoded = handler.decode(message['payload'])
            print(f"✅ Decoded {protocol} payload:\n{json.dumps(decoded, indent=2)}")
            logger.info(f"[Object: {self.object_id}] Got {protocol} message: {decoded}")
        else:
            print(f"⚠️ No handler for protocol '{protocol}', raw payload:")
            print(json.dumps(message['payload'], indent=2))
            logger.info(f"[Object: {self.object_id}] Received message: {message}")

    def shutdown(self):
        self.stop()

    def connect(self):
        """Connect to EMQX broker with no authentication."""
        self.client = Client(client_id=self.object_id)
        self.client.user_data_set(self)
        self.client.on_connect = self._on_connect
        self.client.on_message = self.on_message
        result = self.client.connect(self.broker, self.port, 60)
        if result != 0:
            raise Exception("MQTT connection failed")
        # self.client.subscribe(f"comm/{self.object_id}")
    
    def _on_connect(self, client, userdata, flags, rc):
        """
        Callback for successful connection to the MQTT broker.
        Subscribes to the topic for this object 'communication/<agent_id>', which acts as inbox for the node.
        """
        if rc == 0:
            topic = f"comm/{self.object_id}"
            client.subscribe(topic, qos=1)
            logger.info(f"[Object: {self.object_id}] Subscribed to {topic}")
        else:
            logger.warning(f"[Object: {self.object_id}] Failed to connect with code {rc}")

    def retry_buffered_messages_all(self):
        """Retry all buffered messages for this node, for all destinations."""
        pattern = f"buffer:{self.object_id}:*"
        for key in self.redis.scan_iter(pattern):
            parts = key.decode().split(":")
            if len(parts) == 3:
                destination = parts[2]
                self._retry_single_destination(destination)

    def _retry_single_destination(self, destination):
        """Retry buffered messages for a specific destination."""
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
