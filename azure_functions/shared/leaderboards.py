from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

logger = logging.getLogger(__name__)


def _as_date(value: date | datetime) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


def rebuild_all_leaderboards(cursor, match_id: int | None = None) -> dict[str, Any]:
    """
    Rebuild materialized leaderboard tables (mv_*) — Steps 5–8 of the finalize workflow.

    Args:
        cursor:   DB cursor inside an open transaction.
        match_id: The match just finalized. When None, the most recently completed
                  match is used for mv_match_leaders / mv_match_community_leaders.
    """

    # Resolve match_date for the per-match mv tables.
    if match_id is None:
        cursor.execute(
            """
            SELECT id FROM matches
            WHERE status = 'completed'
            ORDER BY matchTime DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        if row:
            match_id = row["id"]

    # ── Step 5: mv_top_leaders — top 50 users by total match points ──────────
    cursor.execute("DELETE FROM mv_top_leaders")
    logger.info("leaderboards: DELETE mv_top_leaders OK")
    cursor.execute(
        """
        INSERT INTO mv_top_leaders (
          `rank`, totalPoints, name, state, community1, community2, userId, email, createdAt, updatedAt
        )
        SELECT
          rk,
          totalPoints,
          name,
          COALESCE(state, ''),
          community1,
          community2,
          userId,
          COALESCE(email, ''),
          UTC_TIMESTAMP(),
          UTC_TIMESTAMP()
        FROM (
          SELECT
            DENSE_RANK() OVER (ORDER BY totalPoints DESC) AS rk,
            totalPoints,
            name,
            state,
            community1,
            community2,
            userId,
            email
          FROM (
            SELECT
              CAST(u.id AS CHAR) AS userId,
              TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
              SUM(COALESCE(r.matchPoints, 0)) AS totalPoints,
              UPPER(u.state) AS state,
              c1.name AS community1,
              c2.name AS community2,
              u.email AS email
            FROM results r
            INNER JOIN users u ON u.id = r.userId
            LEFT JOIN communities c1 ON c1.id = u.communityId1
            LEFT JOIN communities c2 ON c2.id = u.communityId2
            GROUP BY u.id, u.firstName, u.lastName, u.state, c1.name, c2.name, u.email
          ) totals
        ) ranked
        ORDER BY rk ASC
        LIMIT 50
        """
    )
    logger.info("leaderboards: INSERT mv_top_leaders OK | rows=%s", cursor.rowcount)

    # Sync final_user_results dashboard table (from results table)
    cursor.execute(
        """
        INSERT INTO final_user_results (userId, finalPoint, finalRank, createdAt, updatedAt)
        SELECT
          userId,
          finalPoint,
          DENSE_RANK() OVER (ORDER BY finalPoint DESC) AS finalRank,
          UTC_TIMESTAMP(),
          UTC_TIMESTAMP()
        FROM (
          SELECT
            r.userId,
            SUM(r.matchPoints) AS finalPoint
          FROM results r
          GROUP BY r.userId
        ) totals
        ON DUPLICATE KEY UPDATE
          finalPoint = VALUES(finalPoint),
          finalRank  = VALUES(finalRank),
          updatedAt  = UTC_TIMESTAMP()
        """
    )
    logger.info("leaderboards: UPSERT final_user_results OK | rows=%s", cursor.rowcount)

    # ── Step 6: mv_match_leaders — top 50 users for the current match ─────────
    cursor.execute("DELETE FROM mv_match_leaders")
    logger.info("leaderboards: DELETE mv_match_leaders OK")
    if match_id is not None:
        cursor.execute(
            """
            INSERT INTO mv_match_leaders (
              `rank`, totalPoints, name, state, community1, community2, userId, email, `date`, createdAt, updatedAt
            )
            SELECT
              rk,
              matchPoints,
              name,
              COALESCE(state, ''),
              community1,
              community2,
              userId,
              COALESCE(email, ''),
              UTC_DATE(),
              UTC_TIMESTAMP(),
              UTC_TIMESTAMP()
            FROM (
              SELECT
                DENSE_RANK() OVER (ORDER BY matchPoints DESC) AS rk,
                matchPoints,
                name,
                state,
                community1,
                community2,
                userId,
                email
              FROM (
                SELECT
                  CAST(u.id AS CHAR) AS userId,
                  TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
                  COALESCE(r.matchPoints, 0) AS matchPoints,
                  UPPER(u.state) AS state,
                  c1.name AS community1,
                  c2.name AS community2,
                  u.email AS email
                FROM results r
                INNER JOIN users u ON u.id = r.userId
                LEFT JOIN communities c1 ON c1.id = u.communityId1
                LEFT JOIN communities c2 ON c2.id = u.communityId2
                WHERE r.matchId = %s
              ) match_totals
            ) ranked
            ORDER BY rk ASC
            LIMIT 50
            """,
            (match_id,),
        )
        logger.info("leaderboards: INSERT mv_match_leaders OK | rows=%s", cursor.rowcount)

    # ── Step 7: mv_community_leaders — overall community rankings ─────────────
    cursor.execute("DELETE FROM mv_community_leaders")
    logger.info("leaderboards: DELETE mv_community_leaders OK")
    cursor.execute(
        """
        INSERT INTO mv_community_leaders (
          `rank`, totalPoints, communityName, communityId, createdAt, updatedAt
        )
        SELECT
          rk,
          totalPoints,
          communityName,
          communityId,
          UTC_TIMESTAMP(),
          UTC_TIMESTAMP()
        FROM (
          SELECT
            DENSE_RANK() OVER (ORDER BY totalPoints DESC) AS rk,
            COALESCE(c.name, totals.communityId) AS communityName,
            totals.communityId,
            totals.totalPoints
          FROM (
            SELECT communityId, MAX(totalCommunityPoint) AS totalPoints
            FROM community_results
            GROUP BY communityId
          ) totals
          LEFT JOIN communities c ON c.id = CAST(totals.communityId AS UNSIGNED)
        ) ranked
        ORDER BY rk ASC
        """
    )
    logger.info("leaderboards: INSERT mv_community_leaders OK | rows=%s", cursor.rowcount)

    # ── Step 8: mv_match_community_leaders — community leaders for current match
    cursor.execute("DELETE FROM mv_match_community_leaders")
    logger.info("leaderboards: DELETE mv_match_community_leaders OK")
    if match_id is not None:
        cursor.execute(
            """
            INSERT INTO mv_match_community_leaders (
              `rank`, totalPoints, communityName, communityId, `date`, createdAt, updatedAt
            )
            SELECT
              rk,
              communityMatchPoint,
              communityName,
              communityId,
              UTC_DATE(),
              UTC_TIMESTAMP(),
              UTC_TIMESTAMP()
            FROM (
              SELECT
                DENSE_RANK() OVER (ORDER BY communityMatchPoint DESC) AS rk,
                COALESCE(c.name, cr.communityId) AS communityName,
                cr.communityId,
                cr.communityMatchPoint
              FROM community_results cr
              LEFT JOIN communities c ON c.id = CAST(cr.communityId AS UNSIGNED)
              WHERE cr.matchId = %s
            ) ranked
            ORDER BY rk ASC
            """,
            (match_id,),
        )
        logger.info("leaderboards: INSERT mv_match_community_leaders OK | rows=%s", cursor.rowcount)

    return {
        "match_id": match_id,
    }
