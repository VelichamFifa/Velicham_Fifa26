from __future__ import annotations

import json
import logging
import os
from typing import Any


def _resolve_level() -> int:
    level_name = os.getenv("AZURE_FUNCTIONS_LOG_LEVEL", "INFO").strip().upper()
    return getattr(logging, level_name, logging.INFO)


def configure_logging() -> None:
    level = _resolve_level()
    root = logging.getLogger()
    root.setLevel(level)
    if not root.handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)


def log_step(logger: logging.Logger, step: str, **fields: Any) -> None:
    if fields:
        logger.info("step=%s fields=%s", step, json.dumps(fields, default=str, separators=(",", ":")))
    else:
        logger.info("step=%s", step)
