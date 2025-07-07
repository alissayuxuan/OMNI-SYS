import requests
import json
import time
from remote_base_node import BaseNode

BACKEND_HOST = "192.168.0.2"
BACKEND_PORT = 28000
BROKER_HOST = "192.168.0.2"
BROKER_PORT = 21883
LOGIN_USERNAME = "medical-device-1" # Change to sender's name
LOGIN_PASSWORD = "123456"           # Change to sender's password
TARGET_USERNAME = "doctor-3"        # Change to receiver's name
PROTOCOL = "hl7"                    # Change to desired protocol

API_ROOT = f"http://{BACKEND_HOST}:{BACKEND_PORT}/api"

def get_access_token(username, password):
    url = f"{API_ROOT}/auth/user/token/"
    r = requests.post(url, json={"username": username, "password": password}, timeout=10)
    r.raise_for_status()
    return r.json()["access"]

def get_agent_id(username, token):
    url = f"{API_ROOT}/agents/by-username/{username}/"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    r.raise_for_status()
    return r.json()["agent_id"]

def main():
    token = get_access_token(LOGIN_USERNAME, LOGIN_PASSWORD)
    print("✓ got access token")

    # Resolve IDs
    sender_id = get_agent_id(LOGIN_USERNAME, token)
    receiver_id = get_agent_id(TARGET_USERNAME, token)
    print(f"✓ sender_id={sender_id}, receiver_id={receiver_id}")

    # Spin up BaseNode and send message
    node = BaseNode(str(sender_id), broker=BROKER_HOST, port=BROKER_PORT)
    node.start()

    payload = {
        "patient_id": "P12345",
        "observation": "BP: 120/80",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    node.send_message(
        destination=str(receiver_id),
        protocol=PROTOCOL,
        msg_type="observation",
        payload=payload
    )
    print("✓ message published via MQTT")

    # Keep running to allow MQTT to flush or receive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        node.stop()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ {e}")
