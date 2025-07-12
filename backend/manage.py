#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import time
import yaml
import logging.config


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    try:
        from django.core.management import execute_from_command_line
        print("Starting Django management...")
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    logging.Formatter.converter = time.gmtime # Make sure timestamps are in UTC
    script_dir = os.path.dirname(os.path.abspath(__file__))  # Get the script's directory

    user_action_logs_dir = os.path.join(script_dir, "logs", "user_action_logs")
    db_change_logs_dir = os.path.join(script_dir, "logs", "db_change_logs")

    os.makedirs(user_action_logs_dir, exist_ok=True)
    os.makedirs(db_change_logs_dir, exist_ok=True)

    config_path = os.path.join(script_dir, "audit_logging", "config.yaml")
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        logging.config.dictConfig(config)

        logger = logging.getLogger("omni_sys")
        logger.info("✅ Logging initialized and writing to file.")
    main()
