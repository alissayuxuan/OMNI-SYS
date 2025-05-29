# HL7/DICOM logic

from core.base_node import BaseNode
from core.protocol_router import ProtocolRouter

class MedicalDevice(BaseNode):
    def handle_message(self, message):
        handler = ProtocolRouter.get_handler(message['protocol'])
        if handler:
            if message['protocol'] == "DICOM":
                binary = handler.decode(message['payload'])
                print(f"[Device:{self.object_id}] Got DICOM image ({len(binary)} bytes)")
            elif message['protocol'] == "HL7":
                hl7_str = handler.decode(message['payload'])
                print(f"[Device:{self.object_id}] Got HL7 message: {hl7_str}")
        else:
            print(f"[Device:{self.object_id}] Received message: {message}")
