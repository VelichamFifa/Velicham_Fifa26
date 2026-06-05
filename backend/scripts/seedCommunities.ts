import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type CommunitySeed = {
  name: string;
  fullName?: string;
  isOnline?: boolean;
  state: string;
  city: string;
  address?: string;
  description?: string;
};

const communities: CommunitySeed[] = [
  {
    name: 'Velicham',
    fullName: 'Velicham North America',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: '',
    description: 'Velicham North America.',
  },
  {
    name: 'NANMA',
    fullName: 'North American Network of Malayalee Muslim Association',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: '',
    description: 'North American Network of Malayalee Muslim Association.',
  },
   
];

async function main() {
  console.log('Seeding communities...');

  await prisma.community.deleteMany();
  await prisma.community.createMany({ data: communities });

  const count = await prisma.community.count();
  console.log(`Communities seeded: ${count}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed communities:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

