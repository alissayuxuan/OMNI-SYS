# HL7/DICOM logic

from core.base_node import BaseNode
from core.protocol_router import ProtocolRouter

class MedicalDevice(BaseNode):
    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            decoded = handler.decode(message['payload'])
            print(f"[Device:{self.object_id}] Got {message['protocol']} message: {decoded}")
        else:
            print(f"[Device:{self.object_id}] Received message: {message}")
