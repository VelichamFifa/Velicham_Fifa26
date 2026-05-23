## Azure Functions (Python) – Match finalization + leaderboards

Python Azure Functions that mirror the Node backend finalize/scoring flow against the **same MySQL database** used by `backend/` (Prisma `provider = "mysql"`).

### Functions

- **`finalize_match`** (HTTP POST): set final score, mark match `completed`, score all predictions, upsert `results` + `community_results`. Optional `rebuildLeaderboards: true` refreshes `mv_*` tables.
- **`rebuild_leaderboards`** (HTTP POST): rebuild `mv_top_leaders`, `mv_daily_leaders`, `mv_community_leaders`, `mv_daily_community_leaders`.

### Environment variables

- **`DATABASE_URL`**: Prisma-style MySQL URL (same as backend), e.g.  
  `mysql://user:password@host.mysql.database.azure.com:3306/dbname?sslaccept=strict`
- **`MYSQL_URL`** (optional): overrides `DATABASE_URL`
- **`APPLICATIONINSIGHTS_CONNECTION_STRING`**: enables telemetry and centralized logs in Application Insights
- **`AZURE_FUNCTIONS_LOG_LEVEL`** (optional): app log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`)

Passwords with special characters should be URL-encoded (`@` → `%40`). The parser also supports an unencoded `@` in the password by splitting on the last `@` before the host.

After changing dependencies, run `pip install -r requirements.txt` and restart `func start`.

If MySQL SSL still fails locally, set `MYSQL_SSL_VERIFY=false` in `local.settings.json` `Values` (dev only).

### Local run

```bash
cd azure_functions
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp local.settings.json.example local.settings.json
# Edit local.settings.json with your DATABASE_URL

func start
```

### Example: finalize + rebuild leaderboards

```bash
curl -X POST "http://localhost:7071/api/finalize_match?code=<function-key>" \
  -H "Content-Type: application/json" \
  -d '{"matchId": 1, "team1Score": 2, "team2Score": 1, "rebuildLeaderboards": true}'
```

### Deploy

Deploy as a Python Function App on Azure. Set `DATABASE_URL` in application settings and ensure the function host can reach Azure Database for MySQL (firewall / VNet).
