"""Application logging configuration."""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """Format log records as structured JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "time": self.formatTime(record, self.datefmt),
        }

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        if record.stack_info:
            log_record["stack"] = self.formatStack(record.stack_info)

        for key, value in record.__dict__.items():
            if key.startswith("_") or key in {"msg", "args"}:
                continue
            if key not in log_record and self._is_json_safe(value):
                log_record[key] = value

        return json.dumps(log_record, ensure_ascii=False)

    @staticmethod
    def _is_json_safe(value: Any) -> bool:
        try:
            json.dumps(value)
            return True
        except TypeError:
            return False


def setup_logging() -> None:
    """Configure root logging with JSON formatter."""

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    logging.basicConfig(level=log_level)

    formatter = JsonFormatter()
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(log_level)

    # Dedicated loggers for observability dimensions
    logging.getLogger("security").setLevel(log_level)
    logging.getLogger("performance").setLevel(log_level)
    logging.getLogger("studyin").setLevel(log_level)
