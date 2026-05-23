from __future__ import annotations

import base64
import json
import logging

import azure.functions as func

from ..finalize_match import _finalize

logger = logging.getLogger(__name__)


def main(msg: func.QueueMessage) -> None:
    """Queue-triggered function that processes a finalize-match message.

    The Express backend enqueues a base64-encoded JSON message with shape:
        { "matchId": int, "team1Score": int, "team2Score": int }

    On success the message is automatically deleted by the runtime.
    On exception the runtime retries up to maxDequeueCount times before
    moving the message to the poison queue (finalize-match-queue-poison).
    """
    raw = msg.get_body()

    # The Azure Storage SDK sends messages base64-encoded; the Functions
    # runtime decodes them automatically, but handle both just in case.
    try:
        body_str = raw.decode("utf-8")
    except Exception:
        body_str = raw

    try:
        # Try plain JSON first, then base64-decoded JSON
        try:
            payload = json.loads(body_str)
        except (json.JSONDecodeError, ValueError):
            payload = json.loads(base64.b64decode(body_str).decode("utf-8"))
    except Exception as exc:
        logger.error("process_match_queue: failed to parse message body: %s | raw=%r", exc, raw)
        raise

    match_id = payload.get("matchId")
    team1_score = payload.get("team1Score")
    team2_score = payload.get("team2Score")

    if match_id is None or team1_score is None or team2_score is None:
        logger.error(
            "process_match_queue: missing required fields in payload: %s", payload
        )
        raise ValueError(f"Invalid payload – required fields missing: {payload}")

    try:
        match_id = int(match_id)
        team1_score = int(team1_score)
        team2_score = int(team2_score)
    except (TypeError, ValueError) as exc:
        logger.error("process_match_queue: non-integer values in payload: %s", exc)
        raise

    logger.info(
        "process_match_queue: processing matchId=%s  %s-%s",
        match_id,
        team1_score,
        team2_score,
    )

    # Reuse the finalize logic (scores predictions + rebuilds leaderboards)
    result = _finalize(match_id, team1_score, team2_score, rebuild=True)

    logger.info(
        "process_match_queue: completed matchId=%s  status=%s",
        match_id,
        result.status_code,
    )

    if result.status_code != 200:
        raise RuntimeError(
            f"_finalize returned non-200 for matchId={match_id}: "
            f"status={result.status_code} body={result.get_body()}"
        )
