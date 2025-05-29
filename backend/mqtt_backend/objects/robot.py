# Robot logic

from core.base_node import BaseNode
from core.protocol_router import ProtocolRouter

class Robot(BaseNode):
    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            decoded = handler.decode(message['payload'])
            print(f"[Robot:{self.object_id}] Got {message['protocol']} message: {decoded}")
        else:
            print(f"[Robot:{self.object_id}] Received message: {message}")
