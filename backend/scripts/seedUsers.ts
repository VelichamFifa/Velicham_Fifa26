import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models';
import { seedUsers } from './seedData/users';

dotenv.config();


async function seedUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    const result = await User.insertMany(seedUsers);
    console.log(`Successfully seeded ${result.length} users:`);
    result.forEach((user) => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.userId})`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
