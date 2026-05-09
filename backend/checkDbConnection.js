const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'velichamfifa26_dev'
    ORDER BY TABLE_NAME
  `;

  console.log('CONNECTED');
  console.log(`Host: velicham-fifa-dev.mysql.database.azure.com`);
  console.log(`Database: velichamfifa26_dev`);
  console.log(`Tables: ${rows.length}`);
  for (const row of rows) {
    console.log(`- ${row.TABLE_NAME}`);
  }
}

main()
  .catch((err) => {
    console.error('CONNECTION_FAILED');
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
