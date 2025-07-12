import logging
import time

class BelowErrorFilter(logging.Filter):
    """Filters out messages with level ERROR and above."""
    def filter(self, record):
        return record.levelno < logging.ERROR  # filter returns what should be passed through and not what should be filtered out

class TimezoneFormatter(logging.Formatter):
    """
    Formatter appends the active timezone abbreviation to the log timestamp.
    """
    def converter(self, timestamp):
        dt = datetime.datetime.fromtimestamp(timestamp, pytz.timezone(settings.TIME_ZONE))
        return dt

    def formatTime(self, record, datefmt=None):
        dt = self.converter(record.created)
        tz_abbr = dt.tzname()
        if datefmt:
            s = dt.strftime(datefmt)
        else:
            s = dt.strftime("%Y-%m-%d %H:%M:%S")
        return f"{s} {tz_abbr}"