import time
import json
from threading import Thread
from paho.mqtt.client import Client

BROKER = "localhost" 
PORT = 1883

class BaseNode:
    def __init__(self, object_id, broker=BROKER, port=PORT):
        self.object_id = object_id
        self.client = Client(client_id=object_id)
        self.client.user_data_set(self)
        self.client.on_message = self.on_message
        self.client.connect(BROKER, PORT, 60)
        self.client.subscribe("comm/" + self.object_id)

    def start(self):
        Thread(target=self.client.loop_forever, daemon=True).start()

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
        print(f"[{self.object_id}] Received message: {message}")
