import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

async function main() {
  await prisma.$connect();
  console.log('Connected to SQL Server');

  const communityId = 'Velicham';

  const community = await prisma.community.upsert({
    where: { communityId },
    create: {
      communityId,
      name: 'Velicham',
      isOnline: false,
      state: 'California',
      city: 'San Francisco',
      address: 'California, USA',
    },
    update: {
      name: 'Velicham',
      isOnline: false,
      state: 'California',
      city: 'San Francisco',
      address: 'California, USA',
    },
  });

  console.log('Upserted community:', community);

  await prisma.$disconnect();
  console.log('Database connection closed');
}

main().catch(async (error) => {
  console.error('Insert community error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

