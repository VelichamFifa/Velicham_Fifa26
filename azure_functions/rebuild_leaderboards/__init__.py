from __future__ import annotations

import json
from datetime import datetime

import azure.functions as func

from shared.db import connect
from shared.leaderboards import rebuild_all_leaderboards
from shared.logging_utils import get_logger, log_step


logger = get_logger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    log_step(logger, "request_received", function="rebuild_leaderboards")
    try:
        body = req.get_json()
    except ValueError:
        log_step(logger, "body_missing_or_invalid", function="rebuild_leaderboards")
        body = {}

    date_str = body.get("date")  # optional ISO date or datetime
    target_date = None
    if date_str:
        try:
            target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            log_step(
                logger,
                "target_date_parsed",
                function="rebuild_leaderboards",
                targetDate=target_date.isoformat(),
            )
        except Exception:
            logger.warning("rebuild_leaderboards: invalid date format received (%s)", date_str)
            return func.HttpResponse(
                json.dumps({"error": "Invalid date format. Use ISO format like 2026-06-21 or 2026-06-21T00:00:00Z."}),
                status_code=400,
                mimetype="application/json",
            )

    try:
        log_step(logger, "db_connection_opened", function="rebuild_leaderboards")
        with connect(autocommit=False) as cnxn:
            cur = cnxn.cursor()
            log_step(logger, "rebuild_started", function="rebuild_leaderboards")
            info = rebuild_all_leaderboards(cur, target_date=target_date)
            cnxn.commit()
            log_step(logger, "transaction_committed", function="rebuild_leaderboards")
    except Exception as exc:
        logger.exception("rebuild_leaderboards: rebuild failed")
        return func.HttpResponse(
            json.dumps({"error": "Leaderboard rebuild failed", "details": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )

    log_step(logger, "completed", function="rebuild_leaderboards")

    return func.HttpResponse(
        json.dumps({"message": "Leaderboards rebuilt", **info}),
        status_code=200,
        mimetype="application/json",
    )

