// Load `.env` before `./app` so `FRONTEND_URL` and DB settings exist when `app.ts` reads `config`.
import './config/loadEnv';

import { initializeApp } from './app';

initializeApp().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
