import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Case-insensitive duplicate check matching legacy Mongo $regex exact match behavior.
 */
export async function findExistingCommunityForRequest(name: string, shortName: string) {
  const n = name.trim();
  const s = shortName.trim();
  const rows = await prisma.$queryRaw<Array<{ communityId: string }>>(
    Prisma.sql`
      SELECT TOP 1 communityId
      FROM communities
      WHERE
        LOWER(LTRIM(RTRIM(name))) = LOWER(${n})
        OR LOWER(LTRIM(RTRIM(name))) = LOWER(${s})
        OR (fullName IS NOT NULL AND LOWER(LTRIM(RTRIM(fullName))) = LOWER(${n}))
        OR (fullName IS NOT NULL AND LOWER(LTRIM(RTRIM(fullName))) = LOWER(${s}))
    `
  );
  return rows[0] ?? null;
}
