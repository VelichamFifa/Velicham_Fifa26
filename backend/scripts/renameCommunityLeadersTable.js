const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (
        'top_leaders',
        'mv_top_leaders',
        'community_leaders',
        'mv_community_leaders',
        'daily_leaders',
        'mv_daily_leaders',
        'daily_community_leaders',
        'mv_daily_community_leaders'
      )
    ORDER BY TABLE_NAME
  `;

  const names = new Set(rows.map((r) => r.TABLE_NAME));

  if (names.has('top_leaders') && !names.has('mv_top_leaders')) {
    await prisma.$executeRawUnsafe('RENAME TABLE top_leaders TO mv_top_leaders');
    console.log('Renamed table top_leaders -> mv_top_leaders');
  } else if (names.has('mv_top_leaders')) {
    console.log('Table already renamed: mv_top_leaders');
  } else {
    console.log('Source table top_leaders not found; skipping');
  }

  if (names.has('community_leaders') && !names.has('mv_community_leaders')) {
    await prisma.$executeRawUnsafe('RENAME TABLE community_leaders TO mv_community_leaders');
    console.log('Renamed table community_leaders -> mv_community_leaders');
  } else if (names.has('mv_community_leaders')) {
    console.log('Table already renamed: mv_community_leaders');
  } else {
    console.log('Source table community_leaders not found; skipping');
  }

  if (names.has('daily_community_leaders') && !names.has('mv_daily_community_leaders')) {
    await prisma.$executeRawUnsafe('RENAME TABLE daily_community_leaders TO mv_daily_community_leaders');
    console.log('Renamed table daily_community_leaders -> mv_daily_community_leaders');
  } else if (names.has('mv_daily_community_leaders')) {
    console.log('Table already renamed: mv_daily_community_leaders');
  } else {
    console.log('Source table daily_community_leaders not found; skipping');
  }

  if (names.has('daily_leaders') && !names.has('mv_daily_leaders')) {
    await prisma.$executeRawUnsafe('RENAME TABLE daily_leaders TO mv_daily_leaders');
    console.log('Renamed table daily_leaders -> mv_daily_leaders');
  } else if (names.has('mv_daily_leaders')) {
    console.log('Table already renamed: mv_daily_leaders');
  } else {
    console.log('Source table daily_leaders not found; skipping');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
