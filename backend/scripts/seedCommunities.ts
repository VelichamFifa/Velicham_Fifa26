import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

const communities = [
  { communityId: 'MMNJ', name: 'MMNJ', state: 'New Jersey', city: 'New Jersey', address: 'New Jersey, USA', isOnline: false },
  { communityId: 'GSO', name: 'GSO', state: 'North Carolina', city: 'Greensboro', address: 'Greensboro, NC, USA', isOnline: false },
  { communityId: 'NANMA', name: 'NANMA', state: 'Massachusetts', city: 'Boston', address: 'North America, USA', isOnline: false },
  { communityId: 'Velicham', name: 'Velicham', state: 'California', city: 'San Francisco', address: 'California, USA', isOnline: false },
];

async function seedCommunities() {
  try {
    await prisma.$connect();
    console.log('Connected to SQL Server');

    await prisma.community.deleteMany({});
    console.log('Cleared existing communities');

    const result = await prisma.community.createMany({ data: communities });
    console.log(`Successfully seeded ${result.count} communities:`);
    communities.forEach((c) => console.log(`  - ${c.name} (${c.communityId})`));

    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding communities:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedCommunities();

