from __future__ import annotations

import json
import logging
from datetime import datetime

import azure.functions as func

from shared.db import connect, fetch_all
from shared.leaderboards import rebuild_all_leaderboards
from shared.scoring import calculate_prediction_points, prediction_outcome


logger = logging.getLogger(__name__)


def _community_name(cursor, community_id: int | None) -> str | None:
    if not community_id:
        return None
    cursor.execute("SELECT name FROM communities WHERE id = %s", (community_id,))
    row = cursor.fetchone()
    return row["name"] if row else str(community_id)


def main(req: func.HttpRequest) -> func.HttpResponse:
    logger.info("finalize_match: request received")
    try:
        body = req.get_json()
    except ValueError:
        logger.warning("finalize_match: invalid JSON body")
        return func.HttpResponse(json.dumps({"error": "Invalid JSON"}), status_code=400, mimetype="application/json")

    match_id = body.get("matchId")
    team1_score = body.get("team1Score")
    team2_score = body.get("team2Score")
    rebuild = body.get("rebuildLeaderboards", False)
    logger.info("finalize_match: payload parsed (matchId=%s, rebuild=%s)", match_id, rebuild)

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

    logger.info("finalize_match: validation complete (matchId=%s)", match_id)

    try:
        response = _finalize(
            match_id,
            team1_score,
            team2_score,
            rebuild,
        )
        logger.info("finalize_match: request completed (matchId=%s, status=%s)", match_id, response.status_code)
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
    rebuild: bool,
) -> func.HttpResponse:
    logger.info(
        "finalize_match: begin finalize workflow (matchId=%s, team1Score=%s, team2Score=%s, rebuild=%s)",
        match_id,
        team1_score,
        team2_score,
        rebuild,
    )
    predictions_processed = 0
    skipped_users = 0

    with connect(autocommit=False) as cnxn:
        logger.info("finalize_match: database connection opened")
        cur = cnxn.cursor()

        cur.execute(
            "SELECT id, matchTag, matchTime FROM matches WHERE id = %s",
            (match_id,),
        )
        match_row = cur.fetchone()
        if not match_row:
            logger.warning("finalize_match: match not found (matchId=%s)", match_id)
            return func.HttpResponse(json.dumps({"error": "Match not found"}), status_code=404, mimetype="application/json")

        match_tag = match_row["matchTag"]
        match_time = match_row["matchTime"]
        logger.info("finalize_match: loaded match metadata (matchId=%s, matchTag=%s)", match_id, match_tag)
        match_time_iso = None
        try:
            match_time_iso = match_time.isoformat() if isinstance(match_time, datetime) else None
        except Exception:
            match_time_iso = None

        cur.execute(
            """
            UPDATE matches
            SET team1Score = %s, team2Score = %s, status = 'completed', updatedAt = UTC_TIMESTAMP()
            WHERE id = %s
            """,
            (team1_score, team2_score, match_id),
        )
        logger.info("finalize_match: match row updated to completed (matchId=%s)", match_id)

        cur.execute(
            """
            SELECT id, userId, matchTag, team1Score, team2Score
            FROM predictions
            WHERE matchId = %s
            """,
            (match_id,),
        )
        predictions = fetch_all(cur)
        logger.info("finalize_match: fetched predictions (matchId=%s, count=%s)", match_id, len(predictions))

        community_points: dict[str, int] = {}
        community_name_cache: dict[int, str | None] = {}

        def get_cached_community_name(community_id: int | None) -> str | None:
            if not community_id:
                return None
            if community_id not in community_name_cache:
                community_name_cache[community_id] = _community_name(cur, community_id)
            return community_name_cache[community_id]

        for p in predictions:
            points = calculate_prediction_points(
                int(p["team1Score"]),
                int(p["team2Score"]),
                team1_score,
                team2_score,
            )

            cur.execute(
                "UPDATE predictions SET points = %s, updatedAt = UTC_TIMESTAMP() WHERE id = %s",
                (points, p["id"]),
            )

            cur.execute(
                """
                SELECT u.id, u.firstName, u.lastName, u.email, u.communityId1, u.communityId2
                FROM users u
                WHERE u.id = %s
                """,
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

            cur.execute(
                """
                INSERT INTO results (
                  userId, matchId, matchTag, result, matchPoints, finalPoints,
                  team1PredictedScore, team2PredictedScore,
                  communityName1, communityName2, createdAt, updatedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(), UTC_TIMESTAMP())
                ON DUPLICATE KEY UPDATE
                  matchTag = VALUES(matchTag),
                  result = VALUES(result),
                  matchPoints = VALUES(matchPoints),
                  finalPoints = VALUES(finalPoints),
                  team1PredictedScore = VALUES(team1PredictedScore),
                  team2PredictedScore = VALUES(team2PredictedScore),
                  communityName1 = VALUES(communityName1),
                  communityName2 = VALUES(communityName2),
                  updatedAt = UTC_TIMESTAMP()
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
                    community_name1,
                    community_name2,
                ),
            )

            cid1 = user.get("communityId1")
            cid2 = user.get("communityId2")
            if cid1:
                key1 = str(cid1)
                community_points[key1] = community_points.get(key1, 0) + points
            if cid2 and cid2 != cid1:
                key2 = str(cid2)
                community_points[key2] = community_points.get(key2, 0) + points

            predictions_processed += 1

        logger.info(
            "finalize_match: prediction scoring complete (processed=%s, skippedUsers=%s)",
            predictions_processed,
            skipped_users,
        )

        for community_id, community_match_point in community_points.items():
            cur.execute(
                """
                INSERT INTO community_results (
                  communityId, matchId, matchTag, communityMatchPoint, totalCommunityPoint, createdAt, updatedAt
                )
                VALUES (%s, %s, %s, %s, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())
                ON DUPLICATE KEY UPDATE
                  matchTag = VALUES(matchTag),
                  communityMatchPoint = VALUES(communityMatchPoint),
                  updatedAt = UTC_TIMESTAMP()
                """,
                (community_id, match_id, match_tag, community_match_point),
            )

        logger.info(
            "finalize_match: community results upsert complete (communities=%s)",
            len(community_points),
        )

        leaderboard_info = None
        if rebuild:
            logger.info("finalize_match: leaderboard rebuild requested (matchId=%s)", match_id)
            leaderboard_info = rebuild_all_leaderboards(
                cur,
                target_date=match_time if isinstance(match_time, datetime) else None,
            )
            logger.info("finalize_match: leaderboard rebuild completed (matchId=%s)", match_id)

        cnxn.commit()
        logger.info("finalize_match: database transaction committed (matchId=%s)", match_id)

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
