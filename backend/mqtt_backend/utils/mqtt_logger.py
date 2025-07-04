import paho.mqtt.client as mqtt
import logging

logger = logging.getLogger('omnisyslogger')

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
