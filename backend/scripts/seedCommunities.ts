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
    address: 'Discord',
    description: 'Community for fans of Asian national teams.',
  },
  {
    name: 'NANMA',
    fullName: 'NANMMA',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Telegram',
    description: 'Community for fans of African national teams.',
  },
  {
    name: 'MMNJ',
    fullName: 'MMNJ',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'WhatsApp',
    description: 'Community for fans of North/Central America and Caribbean teams.',
  },
  {
    name: 'MMAC',
    fullName: 'MMAC',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Discord',
    description: 'Community for fans of South American national teams.',
  },
  {
    name: 'GSO',
    fullName: 'GSO',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Telegram',
    description: 'Community for fans of European national teams.',
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

