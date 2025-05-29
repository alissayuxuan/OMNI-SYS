# Unified logging

import logging

def get_logger(name):
    logger = logging.getLogger(name)
    if not logger.hasHandlers():
        logger.setLevel(logging.INFO)
        ch = logging.StreamHandler()
        ch.setFormatter(logging.Formatter('[%(levelname)s] %(message)s'))
        logger.addHandler(ch)
    return logger