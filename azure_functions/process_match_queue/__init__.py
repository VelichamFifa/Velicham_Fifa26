from __future__ import annotations

import base64
import json

import azure.functions as func

from finalize_match import _finalize
from shared.logging_utils import get_logger, log_step

logger = get_logger(__name__)


def main(msg: func.QueueMessage) -> None:
    """Queue-triggered function that processes a finalize-match message.
    The Express backend enqueues a base64-encoded JSON message with shape:
        { "matchId": int, "team1Score": int, "team2Score": int }

    On success the message is automatically deleted by the runtime.
    On exception the runtime retries up to maxDequeueCount times before
    moving the message to the poison queue (finalize-match-queue-poison).
    """
    log_step(logger, "Started", function="process_match_queue")
    raw = msg.get_body()
    dequeue_count = None
    message_id = None
    try:
        dequeue_count = msg.dequeue_count
        message_id = msg.id
    except AttributeError:
        logger.warning("process_match_queue: queue metadata unavailable on message object")
    except Exception:
        logger.exception("process_match_queue: unexpected error while reading queue metadata")

    log_step(
        logger,
        "message_received",
        function="process_match_queue",
        bytes=len(raw) if raw else 0,
        messageId=message_id,
        dequeueCount=dequeue_count,
    )

    # The Azure Storage SDK sends messages base64-encoded; the Functions
    # runtime decodes them automatically, but handle both just in case.
    try:
        body_str = raw.decode("utf-8")
    except Exception:
        body_str = raw
    log_step(logger, "payload_decoded", function="process_match_queue")

    parsed_as_plain_json = True
    try:
        # Try plain JSON first, then base64-decoded JSON
        try:
            payload = json.loads(body_str)
        except (json.JSONDecodeError, ValueError):
            parsed_as_plain_json = False
            payload = json.loads(base64.b64decode(body_str).decode("utf-8"))
    except Exception as exc:
        logger.error("process_match_queue: failed to parse message body: %s | raw=%r", exc, raw)
        raise

    log_step(
        logger,
        "payload_parsed",
        function="process_match_queue",
        mode="plain-json" if parsed_as_plain_json else "base64-json",
    )

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

    log_step(logger, "validation_complete", function="process_match_queue", matchId=match_id)

    logger.info(
        "process_match_queue: processing matchId=%s  %s-%s",
        match_id,
        team1_score,
        team2_score,
    )

    # Reuse the finalize logic (scores predictions + rebuilds leaderboards)
    log_step(logger, "invoke_finalize", function="process_match_queue", matchId=match_id)
    try:
        result = _finalize(match_id, team1_score, team2_score)
    except Exception:
        logger.exception(
            "process_match_queue: finalize threw exception (matchId=%s, messageId=%s, dequeueCount=%s)",
            match_id,
            message_id,
            dequeue_count,
        )
        raise

    logger.info(
        "process_match_queue: completed matchId=%s  status=%s",
        match_id,
        result.status_code,
    )

    if result.status_code == 409:
        # Match was already completed (e.g. duplicate queue message). Treat as success
        # so the message is removed from the queue rather than retried / dead-lettered.
        logger.info(
            "process_match_queue: match already completed, skipping (matchId=%s, messageId=%s)",
            match_id,
            message_id,
        )
        return

    if result.status_code != 200:
        body = result.get_body()
        if isinstance(body, (bytes, bytearray)):
            body_text = body.decode("utf-8", errors="replace")
        else:
            body_text = str(body)
        logger.error(
            "process_match_queue: finalize returned non-200 (matchId=%s, messageId=%s, dequeueCount=%s, status=%s, body=%s)",
            match_id,
            message_id,
            dequeue_count,
            result.status_code,
            body_text,
        )
        raise RuntimeError(
            f"_finalize returned non-200 for matchId={match_id}: "
            f"status={result.status_code} body={result.get_body()}"
        )

    log_step(
        logger,
        "message_processed",
        function="process_match_queue",
        matchId=match_id,
        messageId=message_id,
        dequeueCount=dequeue_count,
    )
