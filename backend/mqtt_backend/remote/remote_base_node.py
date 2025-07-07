import time
import json
import logging
from threading import Thread
from paho.mqtt.client import Client

BROKER_HOST = "192.168.0.2"
BROKER_PORT = 21883
LOGLEVEL = logging.INFO

logging.basicConfig(level=LOGLEVEL)
logger = logging.getLogger("remotenode")

class BaseNode:
    """
    Remote Base Node for handling MQTT communication (same as /core/base_node.py but without Redis buffering)
    """
    def __init__(self, object_id, broker=BROKER_HOST, port=BROKER_PORT):
        self.object_id = object_id
        self.broker = broker
        self.port = port

        self.client = None
        self._thread = None

        self.connect()

    def start(self):
        if not self._thread:
            self._thread = Thread(target=self.client.loop_start, daemon=True)
            self._thread.start()
        logger.info(f"BaseNode {self.object_id} started.")

    def stop(self):
        if self.client:
            self.client.disconnect()
            self.client.loop_stop()
        logger.info(f"BaseNode {self.object_id} stopped.")

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
            result = self.client.publish(topic, json.dumps(envelope), qos=1)
            logger.info(f"[{self.object_id}] Published to {topic}")
            if result.rc != 0:
                raise Exception(f"MQTT publish failed, rc={result.rc}")
        except Exception as e:
            logger.warning(f"MQTT send failed: {e}")

    def on_message(self, client, userdata, msg):
        try:
            message = json.loads(msg.payload.decode())
            logger.info(f"[{self.object_id}] Received message: {message}")
        except Exception as e:
            logger.error(f"Error decoding message: {e}")

    def connect(self):
        """Connect to EMQX broker (no authentication)."""
        self.client = Client(client_id=self.object_id)
        self.client.user_data_set(self)
        self.client.on_connect = self._on_connect
        self.client.on_message = self.on_message
        result = self.client.connect(self.broker, self.port, 60)
        if result != 0:
            raise Exception("MQTT connection failed")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            topic = f"comm/{self.object_id}"
            client.subscribe(topic, qos=1)
            logger.info(f"[Object: {self.object_id}] Subscribed to {topic}")
        else:
            logger.warning(f"[Object: {self.object_id}] Failed to connect with code {rc}")


if __name__ == "__main__":
    node = BaseNode(object_id="my-remote-agent")
    node.start()

    # Example: send a test message
    node.send_message(
        destination="doctor-1",
        protocol="hl7",
        msg_type="observation",
        payload={
            "patient_id": "P12345",
            "observation": "BP: 120/80",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    )

    # Keep running to receive messages
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        node.stop()
