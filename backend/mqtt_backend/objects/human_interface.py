# UI & alerts

from core.base_node import BaseNode
from core.protocol_router import ProtocolRouter

class HumanInterface(BaseNode):
    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            decoded = handler.decode(message['payload'])
            print(f"[HumanInterface:{self.object_id}] Got {message['protocol']} message: {decoded}")
        else:
            print(f"[HumanInterface:{self.object_id}] Received message: {message}")
