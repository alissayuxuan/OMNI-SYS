class HL7Handler:
    @staticmethod
    def encode(hl7_message: str) -> str:
        return hl7_message 
    # Just string now but could be have more complex logic in the future (encryption, check format, etc.)

    @staticmethod
    def decode(payload: str) -> str:
        return payload

