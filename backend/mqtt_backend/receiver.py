import time
from core.base_node import BaseNode

"""
This script starts a receiver node that listens for messages sent to a specific Agent ID.
"""

AGENT_ID = "16"  # Change to receiver's Agent ID

def main():
    node = BaseNode(object_id=AGENT_ID, broker="localhost", port=1883)
    node.start()

    print(f"✓ Receiver {AGENT_ID} is running on VM and listening for messages...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        node.stop()
        print("✗ Receiver stopped.")

if __name__ == "__main__":
    main()
