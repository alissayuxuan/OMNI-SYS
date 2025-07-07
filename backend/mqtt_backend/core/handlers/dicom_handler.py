import base64

"""
DICOM-related utilities for encoding and decoding messages
"""
class DICOMHandler:
    @staticmethod
    def encode(binary_data: bytes) -> str:
        return base64.b64encode(binary_data).decode()

    @staticmethod
    def decode(payload: str) -> bytes:
        return base64.b64decode(payload)
