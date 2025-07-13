import paho.mqtt.client as mqtt
import logging
import sys

"""
MQTT Logger for logging all MQTT communication
This script connects to an MQTT broker and logs all messages received on the "comm/#" topic.
"""

logger = logging.getLogger('omnisyslogger')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Output goes to journalctl
    ]
)

def on_connect(client, userdata, flags, rc):
    logger.info("Logger connected to EMQX!")
    client.subscribe("comm/#")  # Log all communication

def on_message(client, userdata, msg):
    logger.info(f"[LOG] {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client(client_id="logger-agent")
client.on_connect = on_connect
client.on_message = on_message
client.connect("localhost", 1883, 60)
client.loop_forever()
