import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';
import { seedUsers as seedUsersData } from './seedData/users';

dotenv.config();

async function seedUsers() {
  try {
    await prisma.$connect();
    console.log('Connected to SQL Server');

    await prisma.user.deleteMany({});
    console.log('Cleared existing users');

    const result = await prisma.user.createMany({ data: seedUsersData as any });
    console.log(`Successfully seeded ${result.count} users`);

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

