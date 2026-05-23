from __future__ import annotations

import json
import logging
from datetime import datetime

import azure.functions as func

from shared.db import connect
from shared.leaderboards import rebuild_all_leaderboards


logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    logger.info("rebuild_leaderboards: request received")
    try:
        body = req.get_json()
    except ValueError:
        logger.info("rebuild_leaderboards: request body missing or invalid JSON; using defaults")
        body = {}

    date_str = body.get("date")  # optional ISO date or datetime
    target_date = None
    if date_str:
        try:
            target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            logger.info("rebuild_leaderboards: parsed target date (%s)", target_date.isoformat())
        except Exception:
            logger.warning("rebuild_leaderboards: invalid date format received (%s)", date_str)
            return func.HttpResponse(
                json.dumps({"error": "Invalid date format. Use ISO format like 2026-06-21 or 2026-06-21T00:00:00Z."}),
                status_code=400,
                mimetype="application/json",
            )

    try:
        logger.info("rebuild_leaderboards: opening database connection")
        with connect(autocommit=False) as cnxn:
            cur = cnxn.cursor()
            logger.info("rebuild_leaderboards: running leaderboard rebuild")
            info = rebuild_all_leaderboards(cur, target_date=target_date)
            cnxn.commit()
            logger.info("rebuild_leaderboards: transaction committed")
    except Exception as exc:
        logger.exception("rebuild_leaderboards: rebuild failed")
        return func.HttpResponse(
            json.dumps({"error": "Leaderboard rebuild failed", "details": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )

    logger.info("rebuild_leaderboards: completed successfully")

    return func.HttpResponse(
        json.dumps({"message": "Leaderboards rebuilt", **info}),
        status_code=200,
        mimetype="application/json",
    )

