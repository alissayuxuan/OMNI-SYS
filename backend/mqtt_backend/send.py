import requests
import json
import time
from core.base_node import BaseNode 

BROKER_HOST = "localhost"     
BROKER_PORT = 1883
BACKEND_HOST = "localhost"
BACKEND_PORT = 8000

LOGIN_USERNAME = "doctor-1"
LOGIN_PASSWORD = "123456"
TARGET_USERNAME = "medical-device-1"
PROTOCOL = "hl7"

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

    sender_id = get_agent_id(LOGIN_USERNAME, token)
    receiver_id = get_agent_id(TARGET_USERNAME, token)
    print(f"✓ sender_id={sender_id}, receiver_id={receiver_id}")

    node = BaseNode(str(sender_id), broker=BROKER_HOST, port=BROKER_PORT)
    node.start()

    payload = {
        "patient_id": "P67890",
        "observation": "ECG normal",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    node.send_message(destination=str(receiver_id),
                      protocol=PROTOCOL,
                      msg_type="report",
                      payload=payload)
    print("✓ message published via MQTT")

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
