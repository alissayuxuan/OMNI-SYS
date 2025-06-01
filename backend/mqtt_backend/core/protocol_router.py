from .handlers.dicom_handler import DICOMHandler
from .handlers.hl7_handler import HL7Handler

class ProtocolRouter:
    handlers = {
        "DICOM": DICOMHandler,
        "HL7": HL7Handler,
    }

    @classmethod
    def get_handler(cls, protocol):
        return cls.handlers.get(protocol)
