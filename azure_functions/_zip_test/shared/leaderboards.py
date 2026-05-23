from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any


def _as_date(value: date | datetime) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


def _utc_midnight(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)


def rebuild_all_leaderboards(cursor, target_date: datetime | None = None) -> dict[str, Any]:
    """
    Rebuild materialized leaderboard tables (mv_*) from results + community_results.
    Aligned with backend/prisma/schema.prisma (MySQL).
    """

    cursor.execute("DELETE FROM mv_top_leaders")
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
            DENSE_RANK() OVER (ORDER BY totalPoints DESC, name ASC, userId ASC) AS rk,
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
              SUM(COALESCE(r.finalPoints, 0)) AS totalPoints,
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
        """
    )

    # Sync dashboard stats table (final_user_results) from overall leaderboard
    cursor.execute(
        """
        INSERT INTO final_user_results (userId, finalPoint, finalRank, createdAt, updatedAt)
        SELECT CAST(userId AS UNSIGNED), totalPoints, `rank`, UTC_TIMESTAMP(), UTC_TIMESTAMP()
        FROM mv_top_leaders
        ON DUPLICATE KEY UPDATE
          finalPoint = VALUES(finalPoint),
          finalRank = VALUES(finalRank),
          updatedAt = UTC_TIMESTAMP()
        """
    )

    cursor.execute("DELETE FROM mv_community_leaders")
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
            DENSE_RANK() OVER (ORDER BY totalPoints DESC, communityId ASC) AS rk,
            totalPoints,
            COALESCE(c.name, totals.communityId) AS communityName,
            totals.communityId AS communityId
          FROM (
            SELECT
              cr.communityId,
              SUM(COALESCE(cr.communityMatchPoint, 0) * COALESCE(cr.communityWeightagePoint, 1)) AS totalPoints
            FROM community_results cr
            GROUP BY cr.communityId
          ) totals
          LEFT JOIN communities c ON c.id = CAST(totals.communityId AS UNSIGNED)
        ) ranked
        ORDER BY rk ASC
        """
    )

    if target_date is not None:
        days: list[date] = [_as_date(_utc_midnight(target_date))]
    else:
        cursor.execute(
            """
            SELECT DISTINCT DATE(m.matchTime) AS day
            FROM matches m
            WHERE m.status = 'completed'
              AND m.team1Score IS NOT NULL
              AND m.team2Score IS NOT NULL
            """
        )
        days = []
        for row in cursor.fetchall():
            day_val = row["day"]
            days.append(_as_date(day_val) if not isinstance(day_val, date) else day_val)

    for day in days:
        cursor.execute("DELETE FROM mv_daily_leaders WHERE DATE(`date`) = %s", (day,))
        cursor.execute(
            """
            INSERT INTO mv_daily_leaders (
              `rank`, totalPoints, name, state, community1, community2, userId, email, `date`, createdAt, updatedAt
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
              %s,
              UTC_TIMESTAMP(),
              UTC_TIMESTAMP()
            FROM (
              SELECT
                DENSE_RANK() OVER (ORDER BY totalPoints DESC, name ASC, userId ASC) AS rk,
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
                  SUM(COALESCE(r.finalPoints, 0)) AS totalPoints,
                  UPPER(u.state) AS state,
                  c1.name AS community1,
                  c2.name AS community2,
                  u.email AS email
                FROM results r
                INNER JOIN matches m ON m.id = r.matchId
                INNER JOIN users u ON u.id = r.userId
                LEFT JOIN communities c1 ON c1.id = u.communityId1
                LEFT JOIN communities c2 ON c2.id = u.communityId2
                WHERE m.status = 'completed'
                  AND m.team1Score IS NOT NULL
                  AND m.team2Score IS NOT NULL
                  AND DATE(m.matchTime) = %s
                GROUP BY u.id, u.firstName, u.lastName, u.state, c1.name, c2.name, u.email
              ) totals
            ) ranked
            ORDER BY rk ASC
            """,
            (day, day),
        )

        cursor.execute("DELETE FROM mv_daily_community_leaders WHERE DATE(`date`) = %s", (day,))
        cursor.execute(
            """
            INSERT INTO mv_daily_community_leaders (
              `rank`, totalPoints, communityName, communityId, `date`, createdAt, updatedAt
            )
            SELECT
              rk,
              totalPoints,
              communityName,
              communityId,
              %s,
              UTC_TIMESTAMP(),
              UTC_TIMESTAMP()
            FROM (
              SELECT
                DENSE_RANK() OVER (ORDER BY totalPoints DESC, communityId ASC) AS rk,
                totalPoints,
                COALESCE(c.name, totals.communityId) AS communityName,
                totals.communityId AS communityId
              FROM (
                SELECT
                  cr.communityId,
                  SUM(COALESCE(cr.communityMatchPoint, 0) * COALESCE(cr.communityWeightagePoint, 1)) AS totalPoints
                FROM community_results cr
                INNER JOIN matches m ON m.id = cr.matchId
                WHERE m.status = 'completed'
                  AND m.team1Score IS NOT NULL
                  AND m.team2Score IS NOT NULL
                  AND DATE(m.matchTime) = %s
                GROUP BY cr.communityId
              ) totals
              LEFT JOIN communities c ON c.id = CAST(totals.communityId AS UNSIGNED)
            ) ranked
            ORDER BY rk ASC
            """,
            (day, day),
        )

    return {"days_rebuilt": [d.isoformat() for d in days]}
