# FIFA 26 Predictor

Full-stack web app for FIFA match predictions: users submit scores, earn points from a fixed rubric, and appear on individual and community leaderboards.

---

## Tech stack

| Layer        | Technology |
| ------------ | ---------- |
| Frontend     | React 18, TypeScript, Tailwind CSS, Vite |
| Backend      | Node.js 18+, Express, TypeScript |
| Database     | **Azure SQL Database** (or SQL Server) via **Prisma** |
| Auth         | JWT, Google Sign-In (credential flow) |

---

## Repository layout

```
Velicham_Fifa26/
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API client (axios)
│   │   ├── hooks/         # e.g. useAuth
│   │   ├── store/         # Zustand auth store
│   │   └── types/
│   ├── vite.config.ts     # Dev proxy: /api → backend
│   └── package.json
│
└── backend/
    ├── prisma/
    │   └── schema.prisma  # SQL schema + Prisma models
    ├── scripts/           # Seed scripts (tsx)
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── routes/
    │   ├── middleware/
    │   ├── services/      # Scoring, etc.
    │   ├── lib/           # Prisma client singleton
    │   ├── utils/
    │   ├── app.ts
    │   └── index.ts
    └── package.json
```

---

## Prerequisites

- **Node.js** 18 or newer  
- **Azure SQL Database** (or compatible SQL Server) and a SQL login the app can use  
- **Google Cloud** project (optional, for Google Sign-In): OAuth client ID for a Web application  

---

## Azure SQL and Prisma

1. **Create** an Azure SQL server and database, create a **SQL authentication** user (or use an existing login with rights on the database).

2. **Firewall**: In the Azure portal, on the SQL server, allow:
   - your development machine’s IP for local dev, and  
   - **Azure services** (or the specific outbound IPs of your App Service) for production.

3. **`DATABASE_URL`** (Prisma `sqlserver` provider): use a URL like the one in `backend/.env.example`. It is **not** a JDBC string. If you have JDBC, map it to:
   - `sqlserver://HOST:1433;database=DB_NAME;user=USER;password=...`  
   Encode special characters in the password and use `%40` for `@` in usernames when needed.

4. **Pooling / timeouts** (recommended for Azure, especially App Service): the example URL includes parameters such as `connectionLimit`, `poolTimeout`, and `connectTimeout`. Tune them if you see pool timeouts under load.

5. **Apply schema** (from `backend/`):

   ```bash
   npx prisma db push
   ```

   Use **Prisma Migrate** (`prisma migrate dev` / deploy) when you want versioned migrations instead of `db push`.

6. **Inspect data**: `npx prisma studio` (uses `DATABASE_URL` from `backend/.env`).

Schema and table definitions live in `backend/prisma/schema.prisma`.

---

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, GOOGLE_*, FRONTEND_URL, PORT (default 5001 in example)
npx prisma db push
npm run dev
```

Default dev **port** in `.env.example` is **5001** (avoids macOS AirPlay on 5000).

Useful **npm scripts** (see `backend/package.json`):

- `npm run dev` — watch mode with `tsx`  
- `npm run build` — TypeScript compile to `dist/`  
- `npm start` — run `node dist/index.js`  
- `npm run seed:communities` / `seed:teams` / `seed:matches` / `seed:users` — optional data seeds  

**Health check:** `GET http://localhost:5001/health`

---

## Frontend setup

```bash
cd frontend
npm install
# Optional: create .env with VITE_GOOGLE_CLIENT_ID=... and VITE_API_URL if not using the dev proxy
npm run dev
```

- Dev server: **http://localhost:3000**  
- **`VITE_API_URL`**: if unset, the client uses **`/api`**. Vite proxies `/api` to the backend (see `frontend/vite.config.ts`), so local dev should target the same port as `PORT` in the backend `.env` (e.g. 5001).  
- **Production**: set `VITE_API_URL` to your public API base (e.g. `https://your-api.azurewebsites.net/api`) before `npm run build`.

---

## Scoring (summary)

Points per prediction are derived from result and score accuracy (exact rules are implemented in `backend/src/services/scoringService.ts`). Community scoring aggregates member performance for leaderboard views.

---

## API overview

Base path: **`/api`** (except health: **`/health`**).

### Auth (`/api/auth`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/register` | Email/password registration |
| POST | `/login` | Email/password login |
| POST | `/google` | Google ID token (`credential`) |
| GET | `/profile` | JWT required |
| PUT | `/profile` | JWT required — profile / communities |

### Matches (`/api/matches`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/` | List matches |
| GET | `/:matchId` | Match detail |
| POST | `/` | Admin |
| PUT | `/:matchId` | Admin |

### Predictions (`/api/predictions`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/` | JWT |
| GET | `/` | JWT |
| PUT | `/:predictionId` | JWT |
| DELETE | `/:predictionId` | JWT |

### Leaderboard (`/api/leaderboard`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/top` | All-time |
| GET | `/daily` | Daily |
| GET | `/community` | Communities |
| GET | `/community/daily` | Daily community |
| GET | `/ranking/community/:communityId` | Drill-down |
| GET | `/stats` | JWT — user stats |

### Communities (`/api/communities`)

| Method | Path |
| ------ | ---- |
| GET | `/` |
| GET | `/:communityId` |

### Admin (`/api/admin`)

JWT + admin role. Includes community request approval, match finalization, user listing/deletion, etc. See `backend/src/routes/adminRoutes.ts` for exact paths.

---

## Security and configuration (high level)

- **CORS**: driven by `FRONTEND_URL` in backend config — set it to your deployed frontend origin in production.  
- **JWT**: `JWT_SECRET` and `JWT_EXPIRE` in `.env`.  
- **Rate limiting**: applied under `/api/` (see `backend/src/app.ts`).  
- **Validation**: Joi on selected routes.  
- **Never commit** `backend/.env` or real passwords; use `.env.example` as a template only.

---

## Build and production

**Backend**

```bash
cd backend
npm install   # runs prisma generate + build via postinstall
npm start
```

**Frontend**

```bash
cd frontend
npm run build    # output in frontend/dist
```

For **Azure App Service**, configure application settings for the backend (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, `NODE_ENV`, etc.).

### Azure Static Web Apps + separate App Service API

If Network shows requests like `https://<your-static-app>.azurestaticapps.net/api/...`, that only works in **local dev** (Vite proxies `/api` to the backend). On Static Web Apps there is **no** proxy unless you configure one.

Pick **one** approach:

1. **Set the API URL at build time (typical)**  
   Before `npm run build`, set `VITE_API_URL` to your API origin, including `/api`, for example `https://fifa26-backend-xxxx.azurewebsites.net/api`.  
   Copy `frontend/.env.production.example` → `frontend/.env.production` or inject the same variables in your CI workflow. **Redeploy** the Static Web App after rebuilding.  
   After this, the browser should call `fifa26-backend-….azurewebsites.net`, not the static hostname for API traffic.

2. **Link the App Service to the Static Web App (no rebuild for `/api`)**  
   On a **Standard** Static Web App plan you can [link an Azure App Service API](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-app-service). Then requests to `https://<static-app>/api/*` are forwarded to the linked backend. Your Express app must still serve routes under `/api`.

`frontend/public/staticwebapp.config.json` is copied next to `index.html` on `npm run build` so Azure Static Web Apps can use SPA fallback rules.

---

## Troubleshooting

| Issue | What to check |
| ----- | ------------- |
| Cannot connect to Azure SQL | Firewall rules, correct server name, database name, user/password, `encrypt=true` in URL |
| Prisma pool / timeout errors | Lower concurrency or tune `connectionLimit` / `poolTimeout` / `connectTimeout` in `DATABASE_URL` |
| Frontend calls wrong API | `VITE_API_URL` at build time, or dev proxy `target` in `vite.config.ts` vs `PORT` in backend `.env` |
| CORS errors | `FRONTEND_URL` must match the browser origin exactly (scheme + host + port) |
| Google login fails | Client ID matches backend `GOOGLE_CLIENT_ID`; authorized JavaScript origins include your frontend URL |

---

## Testing

Automated test suites are not wired in this README; add `npm test` when implemented.

---

## License

MIT — use for personal or commercial projects according to the license file in the repo (if present).

---

## Contributing

1. Fork or branch from the main development branch  
2. Make focused commits  
3. Open a pull request with a short description of behavior and any DB or env changes  

For step-by-step local installation (Azure SQL, Prisma, seeds, troubleshooting), see **`SETUP.md`**. For a concise list of variables, see **`backend/.env.example`**.
