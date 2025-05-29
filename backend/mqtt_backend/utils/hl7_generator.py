from hl7apy.core import Message

def generate_hl7(msg_type="ADT_A01", msh_kwargs=None, segments=None):
    """
    msg_type: HL7 message type (e.g., "ADT_A01", "ORU_R01")
    msh_kwargs: Dict of MSH segment overrides
    segments: Dict of segment_name -> {field: value, ...}
    """
    msg = Message(msg_type)
    if msh_kwargs:
        for k, v in msh_kwargs.items():
            setattr(msg.msh, k, v)
    if segments:
        for seg_name, fields in segments.items():
            seg = getattr(msg, seg_name.lower())
            for f, v in fields.items():
                setattr(seg, f, v)
    return msg.to_er7()
