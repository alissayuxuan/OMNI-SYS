import time
import json
from threading import Thread
from paho.mqtt.client import Client
from core.protocol_router import ProtocolRouter

BROKER = "localhost" 
PORT = 1883

class BaseNode:
    def __init__(self, object_id, broker=BROKER, port=PORT):
        self.object_id = object_id
        self.client = Client(client_id=object_id)
        self.client.user_data_set(self)
        self.client.on_message = self.on_message
        self.client.connect(broker, port, 60)
        self.client.subscribe("comm/" + self.object_id)
        self._thread = None 

    def start(self):
        if not self._thread:
            self._thread = Thread(target=self.client.loop_start, daemon=True)
            self._thread.start()

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
        self.client.publish(topic, json.dumps(envelope))

    def on_message(self, client, userdata, msg):
        message = json.loads(msg.payload.decode())
        self.handle_message(message)

    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            decoded = handler.decode(message['payload'])
            print(f"[Object: {self.object_id}] Got {message['protocol']} message: {decoded}")
        else:
            print(f"[Object: {self.object_id}] Received message: {message}")

    def shutdown(self):
        try:
            self.client.disconnect()
            self.client.loop_stop()
            print(f"[Object: {self.object_id}] MQTT client disconnected and loop stopped.")
        except Exception as e:
            print(f"Error shutting down {self.object_id}: {e}")
