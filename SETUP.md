# FIFA 26 Predictor — Setup and installation Test

This guide matches the **Azure SQL + Prisma** stack. There is **no MongoDB** and **no Redis** in this project.

For a shorter overview, see **`README.md`**.

---

## Quick start

### 1. Clone and enter the repo

```bash
git clone <repository-url>
cd Velicham_Fifa26
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit **`backend/.env`**:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Prisma `sqlserver://…` connection string (see `backend/.env.example`) |
| `JWT_SECRET` | Signing key for JWTs (use a long random value in production) |
| `PORT` | API port (example uses **5001**; 5000 is often taken on macOS by AirPlay) |
| `FRONTEND_URL` | CORS origin, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google Sign-In on the backend |
| `NODE_ENV` | `development` locally |

Apply the schema to your database (first time or after schema edits):

```bash
npx prisma db push
```

Optional seed data (run from `backend/`):

```bash
npm run seed:communities
npm run seed:teams
npm run seed:matches
npm run seed:users
```

Start the API:

```bash
npm run dev
```

Health check (adjust port if you changed `PORT`):

```bash
curl http://localhost:5001/health
```

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

Optional **`frontend/.env`**:

- `VITE_GOOGLE_CLIENT_ID` — same Web client as used with the backend Google flow  
- `VITE_API_URL` — defaults to **`/api`** in code; Vite proxies `/api` to the backend (see `frontend/vite.config.ts`). For production builds, set this to your real API base (e.g. `https://your-api.azurewebsites.net/api`).

---

## Prerequisites

1. **Node.js** 18 or newer  
2. **Azure SQL Database** (or SQL Server reachable from your machine)

### Azure SQL checklist

1. Create a **server** and **database** in Azure.  
2. Create a **SQL login** (SQL authentication) with rights on that database.  
3. **Networking → Firewall**: allow your **client IP** for local development; for App Service, allow Azure services or the app’s outbound IPs.  
4. Build **`DATABASE_URL`** for Prisma (not JDBC). Example shape:

   `sqlserver://YOUR_SERVER.database.windows.net:1433;database=YOUR_DB;user=YOUR_USER@YOUR_SERVER;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=false;loginTimeout=30;connectTimeout=15;poolTimeout=60;connectionLimit=5`

   Encode special characters in passwords; use **`%40`** for `@` in usernames if the URL parser requires it.

5. If you see **pool timeout** errors under load, lower concurrency or tune `connectionLimit` / `poolTimeout` / `connectTimeout` in the URL.

### Tools for inspecting data

- **Prisma Studio** (from `backend/`): `npx prisma studio`  
- **VS Code:** [SQL Server (mssql)](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) extension  
- **Azure Portal:** database → **Query editor (preview)** (SQL authentication)

### Optional: social sign-in

Configure Google (and Instagram, if you wire it) in Google Cloud / Meta developer consoles and mirror values in **`backend/.env`**.

---

## OS notes

You only need **Node.js** on Windows, macOS, or Linux. **Do not** install MongoDB or Redis for this app.

---

## Verifying installation

| Check | Action |
| ----- | ------ |
| API | `curl http://localhost:5001/health` → JSON with `"status":"ok"` |
| UI | Browser → `http://localhost:3000` |
| Database | `npx prisma studio` from `backend/` and open a table |

---

## Troubleshooting

### Port already in use

```bash
# Frontend (3000) — macOS/Linux
lsof -i :3000

# Backend (5001 or your PORT)
lsof -i :5001
```

Windows (PowerShell):

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5001
```

Stop the process using that port, or change `PORT` / Vite’s proxy target to match.

### Azure SQL / Prisma errors

- Confirm **firewall** allows your current IP (dev) or the app host (prod).  
- Verify **server name**, **database name**, user, and password.  
- Ensure the URL uses **`sqlserver://`** and **`encrypt=true`** as in the example.  
- Re-run `npx prisma db push` after pulling schema changes.

### CORS errors in the browser

`FRONTEND_URL` in **`backend/.env`** must match the frontend origin exactly (`http://localhost:3000` for local Vite).

### `npm install` issues

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

Run these inside **`backend/`** or **`frontend/`** as needed.

---

## Try the app locally

1. Register at `/register` or use **Google** login if configured.  
2. Open **Dashboard**, pick a match, submit a prediction (deadlines enforced by the API).  
3. Open **Leaderboard** pages.

### Sample API calls (curl)

Use your **`PORT`** (default **5001**):

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "password123",
    "city": "NY",
    "state": "NY",
    "country": "USA"
  }'

curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

curl http://localhost:5001/api/leaderboard/top
```

Admin-only routes (e.g. creating matches) require a JWT for a user with **`role: admin`** in the database.

---

## Useful commands

**Backend** (`backend/`)

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server with reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `node dist/index.js` |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync schema to DB |
| `npx prisma studio` | Browse tables |

**Frontend** (`frontend/`)

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production assets → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

---

## Next steps

1. **Scoring** — adjust logic in `backend/src/services/scoringService.ts`.  
2. **Production** — set app settings on **Azure App Service** (or your host): `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_*`, `FRONTEND_URL`, `NODE_ENV=production`, etc. Build the frontend with the correct **`VITE_API_URL`**.  
3. **Theme** — Tailwind and components under `frontend/src/`.

---

## Need more detail?

- **`README.md`** — stack, API summary, repository layout  
- **`backend/.env.example`** — variable names and sample `DATABASE_URL`
