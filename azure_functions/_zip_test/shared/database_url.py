from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import parse_qs, unquote, urlparse


@dataclass(frozen=True)
class MysqlConnectionConfig:
    host: str
    port: int
    user: str
    password: str
    database: str
    ssl: bool


def parse_mysql_url(url: str) -> MysqlConnectionConfig:
    """
    Parse Prisma-style MySQL URL:
      mysql://USER:PASSWORD@HOST:3306/DATABASE?sslaccept=strict

    Passwords containing '@' must be URL-encoded (%40), or use the last '@'
  before the host segment (rsplit) when unencoded.
    """
    if not url.startswith("mysql://"):
        raise ValueError("DATABASE_URL must start with mysql://")

    rest = url[len("mysql://") :]
    path_and_query = rest
    user = ""
    password = ""

    if "@" in rest:
        userinfo, path_and_query = rest.rsplit("@", 1)
        if ":" in userinfo:
            user, password = userinfo.split(":", 1)
        else:
            user = userinfo
        user = unquote(user)
        password = unquote(password)

    if "/" not in path_and_query:
        raise ValueError("DATABASE_URL missing database name")

    hostport, _, db_and_query = path_and_query.partition("/")
    database = db_and_query.split("?", 1)[0]
    if not database:
        raise ValueError("DATABASE_URL missing database name")

    if ":" in hostport:
        host, port_s = hostport.split(":", 1)
        port = int(port_s)
    else:
        host = hostport
        port = 3306

    query = parse_qs(db_and_query.split("?", 1)[1] if "?" in db_and_query else "")
    sslaccept = (query.get("sslaccept") or query.get("sslmode") or [""])[0].lower()
    use_ssl = sslaccept in ("strict", "required", "true", "1")

    if not host:
        raise ValueError("DATABASE_URL missing host")

    return MysqlConnectionConfig(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        ssl=use_ssl,
    )
