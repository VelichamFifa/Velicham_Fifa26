from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import azure.functions as func

from shared.db import connect, fetch_all
from shared.leaderboards import rebuild_all_leaderboards
from shared.logging_utils import get_logger, log_step
from shared.scoring import (
    calculate_prediction_points,
    penalty_shootout_bonus_points,
    prediction_outcome,
)


logger = get_logger(__name__)


def _archive_predictions_to_blob(predictions: list, match_id: int, match_tag: str) -> None:
    """Serialize predictions for a match to JSON and upload to Azure Blob Storage."""
    storage_url = os.environ.get("BLOB_STORAGE_URL")
    if not storage_url:
        logger.warning("finalize_match: BLOB_STORAGE_URL not set, skipping predictions archive")
        return

    from azure.identity import DefaultAzureCredential
    from azure.storage.blob import BlobServiceClient

    def _json_default(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    archived_at = datetime.now(timezone.utc)
    timestamp = archived_at.strftime("%Y%m%dT%H%M%SZ")
    blob_name = f"match_{match_id}_{match_tag}_{timestamp}.json"
    container_name = "predictions-archive"

    payload = json.dumps(
        {
            "matchId": match_id,
            "matchTag": match_tag,
            "archivedAt": archived_at.isoformat(),
            "predictions": [dict(p) for p in predictions],
        },
        default=_json_default,
        indent=2,
    ).encode("utf-8")

    credential = DefaultAzureCredential()
    blob_service = BlobServiceClient(account_url=storage_url, credential=credential)
    container_client = blob_service.get_container_client(container_name)

    try:
        container_client.create_container()
    except Exception:
        pass  # Container already exists

    container_client.upload_blob(name=blob_name, data=payload, overwrite=True)
    logger.info(
        "finalize_match: archived %d predictions to blob %s/%s",
        len(predictions),
        container_name,
        blob_name,
    )

def main(req: func.HttpRequest) -> func.HttpResponse:
    log_step(logger, "request_received", function="finalize_match")
    try:
        body = req.get_json()
    except ValueError:
        logger.warning("finalize_match: invalid JSON body")
        return func.HttpResponse(json.dumps({"error": "Invalid JSON"}), status_code=400, mimetype="application/json")

    match_id = body.get("matchId")
    team1_score = body.get("team1Score")
    team2_score = body.get("team2Score")
    penalty_shootout_winner = body.get("penaltyShootoutWinner")
    log_step(logger, "payload_parsed", function="finalize_match", matchId=match_id)

    if not match_id:
        logger.warning("finalize_match: missing matchId")
        return func.HttpResponse(json.dumps({"error": "matchId is required"}), status_code=400, mimetype="application/json")
    if team1_score is None or team2_score is None:
        logger.warning("finalize_match: missing score fields for matchId=%s", match_id)
        return func.HttpResponse(
            json.dumps({"error": "team1Score and team2Score are required"}),
            status_code=400,
            mimetype="application/json",
        )

    try:
        match_id = int(match_id)
        team1_score = int(team1_score)
        team2_score = int(team2_score)
    except (TypeError, ValueError):
        logger.warning("finalize_match: non-integer input values")
        return func.HttpResponse(json.dumps({"error": "matchId and scores must be integers"}), status_code=400, mimetype="application/json")

    log_step(logger, "validation_complete", function="finalize_match", matchId=match_id)

    try:
        response = _finalize(match_id, team1_score, team2_score, penalty_shootout_winner)
        log_step(logger, "request_completed", function="finalize_match", matchId=match_id, status=response.status_code)
        return response
    except Exception as exc:
        logger.exception("finalize_match: failed (matchId=%s)", match_id)
        return func.HttpResponse(
            json.dumps({"error": "Finalize match failed", "details": str(exc)}),
            status_code=500,
            mimetype="application/json",
        )


def _finalize(
    match_id: int,
    team1_score: int,
    team2_score: int,
    penalty_shootout_winner: str | None = None,
) -> func.HttpResponse:
    logger.info(
        "finalize_match: begin (matchId=%s, team1Score=%s, team2Score=%s)",
        match_id, team1_score, team2_score,
    )
    predictions_processed = 0
    skipped_users = 0

    with connect(autocommit=False) as cnxn:
        log_step(logger, "db_connection_opened", function="finalize_match", matchId=match_id)
        cur = cnxn.cursor()

        # Load match metadata
        cur.execute("SELECT id, matchTag, matchTime, status, team1, team2, round, `group`, isKnockoutMatch FROM matches WHERE id = %s", (match_id,))
        match_row = cur.fetchone()
        if not match_row:
            logger.warning("finalize_match: match not found (matchId=%s)", match_id)
            return func.HttpResponse(json.dumps({"error": "Match not found"}), status_code=404, mimetype="application/json")

        if match_row["status"] in ("completed"):
            logger.warning(
                "finalize_match: match already %s, skipping (matchId=%s)",
                match_row["status"], match_id,
            )
            return func.HttpResponse(
                json.dumps({"message": f"Match already {match_row['status']}", "matchId": match_id}),
                status_code=409,
                mimetype="application/json",
            )

        match_tag = match_row["matchTag"]
        match_time = match_row["matchTime"]
        match_time_iso = match_time.isoformat() if isinstance(match_time, datetime) else None
        match_team1 = match_row["team1"]
        match_team2 = match_row["team2"]
        knockout_match = bool(match_row.get("isKnockoutMatch"))
        if knockout_match and team1_score == team2_score:
            if not penalty_shootout_winner:
                return func.HttpResponse(
                    json.dumps({"error": "penaltyShootoutWinner is required for knockout draw results"}),
                    status_code=400,
                    mimetype="application/json",
                )
            if penalty_shootout_winner not in (match_team1, match_team2):
                return func.HttpResponse(
                    json.dumps({"error": "penaltyShootoutWinner must be one of the match teams"}),
                    status_code=400,
                    mimetype="application/json",
                )
        resolved_penalty_winner = penalty_shootout_winner if (knockout_match and team1_score == team2_score) else None
        log_step(logger, "match_metadata_loaded", function="finalize_match", matchId=match_id, matchTag=match_tag)

        # ── Step 0: Archive predictions to blob FIRST ──── f──────────────────
        cur.execute(
            "SELECT id, userId, matchTag, team1Score, team2Score, penaltyShootoutWinner, submittedTime FROM predictions WHERE matchId = %s",
            (match_id,),
        )
        predictions = fetch_all(cur)
        log_step(logger, "predictions_fetched", function="finalize_match", matchId=match_id, count=len(predictions))

        try:
            _archive_predictions_to_blob(predictions, match_id, match_tag)
            log_step(logger, "predictions_archived", function="finalize_match", matchId=match_id, count=len(predictions))
        except Exception:
            logger.exception("finalize_match: blob archive failed (matchId=%s), continuing", match_id)

        # ── Step 1: Update match table (status → publishing while processing) ──
        cur.execute(
            """
            UPDATE matches
            SET team1Score = %s, team2Score = %s, penaltyShootoutWinner = %s, status = 'publishing', updatedAt = UTC_TIMESTAMP()
            WHERE id = %s
            """,
            (team1_score, team2_score, resolved_penalty_winner, match_id),
        )
        log_step(logger, "match_publishing", function="finalize_match", matchId=match_id)

        # ── Steps 2 & 3: Score predictions and write results ─ggg──────────────
        community_name_cache: dict[int, str | None] = {}

        def get_cached_community_name(community_id: int | None) -> str | None:
            if not community_id:
                return None
            if community_id not in community_name_cache:
                cur.execute("SELECT name FROM communities WHERE id = %s", (community_id,))
                row = cur.fetchone()
                community_name_cache[community_id] = row["name"] if row else str(community_id)
            return community_name_cache[community_id]

        for p in predictions:
            # Step 2: Calculate match points
            points = calculate_prediction_points(
                int(p["team1Score"]),
                int(p["team2Score"]),
                team1_score,
                team2_score,
            )
            penalty_bonus = penalty_shootout_bonus_points(
                knockout_match=knockout_match,
                predicted_team1=int(p["team1Score"]),
                predicted_team2=int(p["team2Score"]),
                actual_team1=team1_score,
                actual_team2=team2_score,
                predicted_penalty_winner=p.get("penaltyShootoutWinner"),
                actual_penalty_winner=resolved_penalty_winner,
            )
            points += penalty_bonus
            cur.execute(
                "UPDATE predictions SET points = %s, updatedAt = UTC_TIMESTAMP() WHERE id = %s",
                (points, p["id"]),
            )

            cur.execute(
                "SELECT id, firstName, lastName, email, communityId1, communityId2 FROM users WHERE id = %s",
                (p["userId"],),
            )
            user = cur.fetchone()
            if not user:
                skipped_users += 1
                continue

            community_name1 = get_cached_community_name(user.get("communityId1"))
            community_name2 = get_cached_community_name(user.get("communityId2"))
            outcome = prediction_outcome(
                int(p["team1Score"]),
                int(p["team2Score"]),
                team1_score,
                team2_score,
            )

            # Step 3: Insert result (finalPoints = matchPoints initially; updated cumulatively below)
            cur.execute(
                """
                INSERT INTO results (
                  userId, matchId, matchTag, result, matchPoints, finalPoints,
                                    team1PredictedScore, team2PredictedScore,
                                    predictedPenaltyShootoutWinner, actualPenaltyShootoutWinner, penaltyShootoutPoints,
                  communityName1, communityName2, predictionTime, createdAt, updatedAt
                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(), UTC_TIMESTAMP())
                ON DUPLICATE KEY UPDATE
                  matchTag            = VALUES(matchTag),
                  result              = VALUES(result),
                  matchPoints         = VALUES(matchPoints),
                  finalPoints         = VALUES(matchPoints),
                  team1PredictedScore = VALUES(team1PredictedScore),
                  team2PredictedScore = VALUES(team2PredictedScore),
                                    predictedPenaltyShootoutWinner = VALUES(predictedPenaltyShootoutWinner),
                                    actualPenaltyShootoutWinner = VALUES(actualPenaltyShootoutWinner),
                                    penaltyShootoutPoints = VALUES(penaltyShootoutPoints),
                  communityName1      = VALUES(communityName1),
                  communityName2      = VALUES(communityName2),
                  predictionTime      = VALUES(predictionTime),
                  updatedAt           = UTC_TIMESTAMP()
                """,
                (
                    user["id"],
                    match_id,
                    p["matchTag"],
                    outcome,
                    points,
                    points,
                    int(p["team1Score"]),
                    int(p["team2Score"]),
                    p.get("penaltyShootoutWinner"),
                    resolved_penalty_winner,
                    penalty_bonus,
                    community_name1,
                    community_name2,
                    p.get("submittedTime"),
                ),
            )
            predictions_processed += 1

        log_step(logger, "prediction_scoring_complete", function="finalize_match",
                 matchId=match_id, processed=predictions_processed, skippedUsers=skipped_users)

        # Step 3: finalPoints = cumulative SUM(matchPoints) across ALL matches for each user
        cur.execute(
            """
            UPDATE results r
            INNER JOIN (
              SELECT userId, SUM(matchPoints) AS cumulative
              FROM results
              GROUP BY userId
            ) totals ON totals.userId = r.userId
            SET r.finalPoints = totals.cumulative,
                r.updatedAt   = UTC_TIMESTAMP()
            WHERE r.matchId = %s
            """,
            (match_id,),
        )

        # Step 3: matchRank = rank within this match by matchPoints
        cur.execute(
            """
            UPDATE results r
            INNER JOIN (
              SELECT id,
                DENSE_RANK() OVER (ORDER BY COALESCE(matchPoints, 0) DESC) AS mr
              FROM results
              WHERE matchId = %s
            ) ranked ON ranked.id = r.id
            SET r.matchRank = ranked.mr,
                r.updatedAt = UTC_TIMESTAMP()
            WHERE r.matchId = %s
            """,
            (match_id, match_id),
        )

        # Step 3: finalRank = overall rank by SUM(matchPoints) across all matches (update current match rows only)
        final_rank_sql = """
            UPDATE results r
            INNER JOIN (
              SELECT userId,
                DENSE_RANK() OVER (ORDER BY SUM(matchPoints) DESC) AS fr
              FROM results
              GROUP BY userId
            ) ranked ON ranked.userId = r.userId
            SET r.finalRank = ranked.fr,
                r.updatedAt = UTC_TIMESTAMP()
            WHERE r.matchId = %s
            """
        logger.info(
            "finalize_match: executing finalRank UPDATE | matchId=%s | sql=%s",
            match_id,
            " ".join(final_rank_sql.split()),
        )
        cur.execute(final_rank_sql, (match_id,))
        logger.info(
            "finalize_match: finalRank UPDATE done | matchId=%s | rows_affected=%s",
            match_id,
            cur.rowcount,
        )
        log_step(logger, "results_ranks_updated", function="finalize_match", matchId=match_id)

                # Step 4: Community results ───────────────────────────────────────
                # communityWeightagePoint = 1 point per full 10 members in the community.
                # communityMatchPoint = AVG member match points + communityWeightagePoint bonus.
                # Uses UNION to cover both communityId1 and communityId2 memberships.
        cur.execute(
            """
            INSERT INTO community_results (
                            communityId, matchId, matchTag, communityWeightagePoint, communityMatchPoint, totalCommunityPoint, createdAt, updatedAt
            )
            SELECT
              CAST(members.communityId AS CHAR),
              %s,
              %s,
                            FLOOR(COUNT(DISTINCT members.userId) / 10),
                            ROUND(AVG(r.matchPoints)) + FLOOR(COUNT(DISTINCT members.userId) / 10),
              0,
              UTC_TIMESTAMP(),
              UTC_TIMESTAMP()
            FROM results r
            INNER JOIN (
              SELECT id AS userId, communityId1 AS communityId FROM users WHERE communityId1 IS NOT NULL
              UNION
              SELECT id AS userId, communityId2 AS communityId FROM users WHERE communityId2 IS NOT NULL
            ) members ON members.userId = r.userId
            WHERE r.matchId = %s
            GROUP BY members.communityId
            ON DUPLICATE KEY UPDATE
              matchTag            = VALUES(matchTag),
                            communityWeightagePoint = VALUES(communityWeightagePoint),
              communityMatchPoint = VALUES(communityMatchPoint),
              updatedAt           = UTC_TIMESTAMP()
            """,
            (match_id, match_tag, match_id),
        )

        # Step 4: totalCommunityPoint = cumulative SUM of communityMatchPoints per community
        cur.execute(
            """
            UPDATE community_results cr
            INNER JOIN (
              SELECT communityId, SUM(communityMatchPoint) AS cumulative
              FROM community_results
              GROUP BY communityId
            ) totals ON totals.communityId = cr.communityId
            SET cr.totalCommunityPoint = totals.cumulative,
                cr.updatedAt           = UTC_TIMESTAMP()
            WHERE cr.matchId = %s
            """,
            (match_id,),
        )

        # Step 4: dailyRank = rank by communityMatchPoint within this match
        cur.execute(
            """
            UPDATE community_results cr
            INNER JOIN (
              SELECT id,
                DENSE_RANK() OVER (ORDER BY communityMatchPoint DESC) AS dr
              FROM community_results
              WHERE matchId = %s
            ) ranked ON ranked.id = cr.id
            SET cr.dailyRank = ranked.dr,
                cr.updatedAt = UTC_TIMESTAMP()
            WHERE cr.matchId = %s
            """,
            (match_id, match_id),
        )

        # Step 4: finalRank = rank by MAX(totalCommunityPoint) across all matches (update current match rows only)
        cur.execute(
            """
            UPDATE community_results cr
            INNER JOIN (
              SELECT communityId,
                DENSE_RANK() OVER (ORDER BY MAX(totalCommunityPoint) DESC) AS fr
              FROM community_results
              GROUP BY communityId
            ) ranked ON ranked.communityId = cr.communityId
            SET cr.finalRank = ranked.fr,
                cr.updatedAt = UTC_TIMESTAMP()
            WHERE cr.matchId = %s
            """,
            (match_id,),
        )
        log_step(logger, "community_results_complete", function="finalize_match", matchId=match_id)

        # ── Steps 5–8: Rebuild materialized view tables ─────────────────────
        log_step(logger, "leaderboard_rebuild_started", function="finalize_match", matchId=match_id)
        leaderboard_info = rebuild_all_leaderboards(cur, match_id)
        log_step(logger, "leaderboard_rebuild_completed", function="finalize_match", matchId=match_id)

        # ── Step 9: Delete predictions ──────────────────────────────────────
        cur.execute("DELETE FROM predictions WHERE matchId = %s", (match_id,))
        log_step(logger, "predictions_deleted", function="finalize_match",
                 matchId=match_id, deleted=cur.rowcount)

        # ── Final: Mark match as completed ─────────────────────────────────
        cur.execute(
            "UPDATE matches SET status = 'completed', completedAt = UTC_TIMESTAMP(), updatedAt = UTC_TIMESTAMP() WHERE id = %s",
            (match_id,),
        )
        log_step(logger, "match_completed", function="finalize_match", matchId=match_id)

        cnxn.commit()
        log_step(logger, "transaction_committed", function="finalize_match", matchId=match_id)

    return func.HttpResponse(
        json.dumps(
            {
                "message": "Match finalized and points calculated",
                "matchId": match_id,
                "team1Score": team1_score,
                "team2Score": team2_score,
                "matchTime": match_time_iso,
                "predictionsProcessed": predictions_processed,
                "leaderboards": leaderboard_info,
            }
        ),
        status_code=200,
        mimetype="application/json",
    )
