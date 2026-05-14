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
    name: 'AFC Fans Hub',
    fullName: 'Asian Football Confederation Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Discord',
    description: 'Community for fans of Asian national teams.',
  },
  {
    name: 'CAF Fans Hub',
    fullName: 'Confederation of African Football Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Telegram',
    description: 'Community for fans of African national teams.',
  },
  {
    name: 'CONCACAF Fans Hub',
    fullName: 'CONCACAF Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'WhatsApp',
    description: 'Community for fans of North/Central America and Caribbean teams.',
  },
  {
    name: 'CONMEBOL Fans Hub',
    fullName: 'South American Football Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Discord',
    description: 'Community for fans of South American national teams.',
  },
  {
    name: 'UEFA Fans Hub',
    fullName: 'European Football Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'Telegram',
    description: 'Community for fans of European national teams.',
  },
  {
    name: 'OFC Fans Hub',
    fullName: 'Oceania Football Confederation Fans Hub',
    isOnline: true,
    state: 'Global',
    city: 'Online',
    address: 'WhatsApp',
    description: 'Community for fans of Oceania national teams.',
  },
  {
    name: 'Chennai Football Circle',
    fullName: 'Chennai Football Circle',
    isOnline: false,
    state: 'Tamil Nadu',
    city: 'Chennai',
    address: 'Anna Nagar',
    description: 'Local football prediction community in Chennai.',
  },
  {
    name: 'Bengaluru Football Circle',
    fullName: 'Bengaluru Football Circle',
    isOnline: false,
    state: 'Karnataka',
    city: 'Bengaluru',
    address: 'Indiranagar',
    description: 'Local football prediction community in Bengaluru.',
  },
  {
    name: 'Mumbai Football Circle',
    fullName: 'Mumbai Football Circle',
    isOnline: false,
    state: 'Maharashtra',
    city: 'Mumbai',
    address: 'Andheri',
    description: 'Local football prediction community in Mumbai.',
  },
  {
    name: 'Hyderabad Football Circle',
    fullName: 'Hyderabad Football Circle',
    isOnline: false,
    state: 'Telangana',
    city: 'Hyderabad',
    address: 'Banjara Hills',
    description: 'Local football prediction community in Hyderabad.',
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

