

from typing import TypedDict, Optional
from datetime import datetime

class MessagePayload(TypedDict, total=False):
    type: str  # 'report', 'alert', 'command', etc.
    protocol: Optional[str]  # 'mqtt', 'hl7', 'dicom'
    message: Optional[str]   # HL7 string or command
    command: Optional[str]   # e.g., 'C-STORE', 'C-FIND'
    dataset: Optional[dict]  # DICOM dataset as JSON
    patient_id: Optional[str]
    heart_rate: Optional[int]
    alert: Optional[str]
    timestamp: Optional[str]  # ISO timestamp

class Envelope(TypedDict):
    sender: str
    receiver: str
    timestamp: str  # ISO format
    payload: MessagePayload