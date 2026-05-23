from __future__ import annotations

import os
import ssl
from contextlib import contextmanager
from typing import Any, Iterable

import certifi
import pymysql
from pymysql.cursors import DictCursor

from .database_url import parse_mysql_url


def _ssl_context() -> ssl.SSLContext:
    """TLS for Azure Database for MySQL (uses Mozilla CA bundle via certifi)."""
    verify = os.getenv("MYSQL_SSL_VERIFY", "true").strip().lower() not in (
        "0",
        "false",
        "no",
    )
    if verify:
        return ssl.create_default_context(cafile=certifi.where())
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _connection_kwargs() -> dict[str, Any]:
    explicit = os.getenv("MYSQL_URL", "").strip()
    prisma_url = explicit or os.getenv("DATABASE_URL", "").strip()
    if not prisma_url:
        raise RuntimeError("Missing DATABASE_URL (mysql://...) or MYSQL_URL.")

    cfg = parse_mysql_url(prisma_url)
    kwargs: dict[str, Any] = {
        "host": cfg.host,
        "port": cfg.port,
        "user": cfg.user,
        "password": cfg.password,
        "database": cfg.database,
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": False,
    }
    if cfg.ssl:
        kwargs["ssl"] = _ssl_context()
    return kwargs


@contextmanager
def connect(autocommit: bool = False):
    cnxn = pymysql.connect(**_connection_kwargs())
    try:
        cnxn.autocommit(autocommit)
        yield cnxn
    finally:
        cnxn.close()


def fetch_all(cursor: pymysql.cursors.Cursor) -> list[dict[str, Any]]:
    rows = cursor.fetchall()
    return list(rows) if rows else []


def exec_many(cursor: pymysql.cursors.Cursor, sql: str, params_seq: Iterable[Iterable[Any]]):
    cursor.executemany(sql, list(params_seq))
