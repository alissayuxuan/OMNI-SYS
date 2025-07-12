import logging
import datetime
import pytz
from django.conf import settings

class BelowErrorFilter(logging.Filter):
    """Filters out messages with level ERROR and above."""
    def filter(self, record):
        return record.levelno < logging.ERROR  # filter returns what should be passed through and not what should be filtered out

class TimezoneFormatter(logging.Formatter):
    """
    Logging formatter that uses settings.TIME_ZONE and includes the correct
    timezone abbreviation (e.g., UTC) at the log record timestamp.
    """
    def formatTime(self, record, datefmt=None):
        tz = pytz.timezone(settings.TIME_ZONE)
        dt = datetime.datetime.fromtimestamp(record.created, tz)
        tz_abbr = dt.tzname()
        s = dt.strftime(datefmt or "%Y-%m-%d %H:%M:%S")
        return f"{s} {tz_abbr}"