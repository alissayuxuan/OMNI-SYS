import time
from remote_base_node import BaseNode

"""
This script starts a receiver node that listens for messages sent to a specific Agent ID.
"""

AGENT_ID = "15"  # Change to receiver's Agent ID

def main():
    node = BaseNode(object_id=AGENT_ID, broker="192.168.0.2", port=21883)
    node.start()

    print(f"✓ Receiver {AGENT_ID} is running on remote and listening for messages...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        node.stop()
        print("✗ Receiver stopped.")

if __name__ == "__main__":
    main()