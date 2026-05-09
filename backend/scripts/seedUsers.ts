import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

const users = [
  {
    userId: 'USR001',
    email: 'arun.velicham@example.com',
    firstName: 'Arun',
    lastName: 'Nair',
    state: 'New Jersey',
    city: 'Edison',
    country: 'USA',
    communityId1: 'MMNJ',
    role: 'user',
  },
  {
    userId: 'USR002',
    email: 'meera.gso@example.com',
    firstName: 'Meera',
    lastName: 'Pillai',
    state: 'North Carolina',
    city: 'Greensboro',
    country: 'USA',
    communityId1: 'GSO',
    role: 'user',
  },
  {
    userId: 'USR003',
    email: 'sree.nanma@example.com',
    firstName: 'Sree',
    lastName: 'Menon',
    state: 'Massachusetts',
    city: 'Boston',
    country: 'USA',
    communityId1: 'NANMA',
    role: 'user',
  },
  {
    userId: 'USR004',
    email: 'admin.velicham@example.com',
    firstName: 'Admin',
    lastName: 'User',
    state: 'California',
    city: 'San Francisco',
    country: 'USA',
    communityId1: 'Velicham',
    role: 'admin',
  },
];

async function seedUsers() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    await prisma.user.deleteMany({});
    console.log('Cleared existing users');

    const result = await prisma.user.createMany({ data: users });
    console.log(`Successfully seeded ${result.count} users:`);
    users.forEach((u) => console.log(`  - ${u.firstName} ${u.lastName} (${u.userId})`));

    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedUsers();
