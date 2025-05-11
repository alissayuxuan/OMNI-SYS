import logging

class BelowErrorFilter(logging.Filter):
    """Filters out messages with level ERROR and above."""
    def filter(self, record):
        return record.levelno < logging.ERROR  # filter returns what should be passed through and not what should be filtered out
