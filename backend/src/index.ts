// Load `.env` before `./app` so `FRONTEND_URL` and DB settings exist when `app.ts` reads `config`.
import './config/loadEnv';

import { initializeApp } from './app';
import { logger } from './lib/logger';

initializeApp().catch((error) => {
  logger.error('initializeApp', error);
  process.exit(1);
});
