import time
import json
from threading import Thread
from paho.mqtt.client import Client
from .protocol_router import ProtocolRouter
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer


BROKER = "localhost" 
PORT = 1883

class BaseNode:
    def __init__(self, object_id, username, password, broker=BROKER, port=PORT):
        self.object_id = object_id
        self.username = username
        self.password = password
        self.broker = broker
        self.port = port

        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None

        try:
            self.load_tokens()
            self.connect_with_token()
        except Exception as e:
            print(f"[Retry] Access token failed, trying refresh: {e}")
            try:
                self.refresh_access_token()
                self.connect_with_token()
            except Exception as e2:
                print(f"[Retry] Refresh token failed, re-authenticating: {e2}")
                self.get_new_tokens()
                self.connect_with_token()

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
    
    def get_new_tokens(self):
        """Full re-authentication using username/password"""
        serializer = TokenObtainPairSerializer(data={
            "username": self.username,
            "password": self.password
        })
        serializer.is_valid(raise_exception=True)
        self.access_token = serializer.validated_data["access"]
        self.refresh_token = serializer.validated_data["refresh"]
        self.token_expiry = time.time() + 25 * 60

    def refresh_access_token(self):
        """Use refresh token to get a new access token"""
        serializer = TokenRefreshSerializer(data={
            "refresh": self.refresh_token
        })
        serializer.is_valid(raise_exception=True)
        self.access_token = serializer.validated_data["access"]
        self.token_expiry = time.time() + 25 * 60

    def load_tokens(self):
        """Optionally load saved tokens (for now we assume fresh start)"""
        self.get_new_tokens()

    def connect_with_token(self):
        """Try to connect to EMQX with current access token"""
        self.client = Client(client_id=self.object_id)
        self.client.username_pw_set(username=self.object_id, password=self.access_token)
        self.client.user_data_set(self)
        self.client.on_message = self.on_message
        result = self.client.connect(self.broker, self.port, 60)
        if result != 0:
            raise Exception("MQTT connection failed")

        self.client.subscribe(f"comm/{self.object_id}")
        self._thread = None
