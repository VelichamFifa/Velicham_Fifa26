import path from 'path';
import dotenv from 'dotenv';

/** Load `.env` from the backend package root before Prisma or other modules read `process.env`. */
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
