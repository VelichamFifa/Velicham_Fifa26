from __future__ import annotations

import json
from datetime import datetime

import azure.functions as func

from ..shared.db import connect
from ..shared.leaderboards import rebuild_all_leaderboards


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        body = {}

    date_str = body.get("date")  # optional ISO date or datetime
    target_date = None
    if date_str:
        try:
            target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            return func.HttpResponse(
                json.dumps({"error": "Invalid date format. Use ISO format like 2026-06-21 or 2026-06-21T00:00:00Z."}),
                status_code=400,
                mimetype="application/json",
            )

    try:
        with connect(autocommit=False) as cnxn:
            cur = cnxn.cursor()
            info = rebuild_all_leaderboards(cur, target_date=target_date)
            cnxn.commit()
    except Exception as exc:
        return func.HttpResponse(
            json.dumps({"error": "Leaderboard rebuild failed", "details": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )

    return func.HttpResponse(
        json.dumps({"message": "Leaderboards rebuilt", **info}),
        status_code=200,
        mimetype="application/json",
    )

