import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Community } from '../src/models';

dotenv.config();

const communities = [
  {
    communityId: 'MMNJ',
    name: 'MMNJ',
    state: 'New Jersey',
    city: 'New Jersey',
    address: 'New Jersey, USA',
  },
  {
    communityId: 'GSO',
    name: 'GSO',
    state: 'North Carolina',
    city: 'Greensboro',
    address: 'Greensboro, NC, USA',
  },
  {
    communityId: 'NANMA',
    name: 'NANMA',
    state: 'Massachusetts',
    city: 'Boston',
    address: 'North America, USA',
  },
  {
    communityId: 'Velicham',
    name: 'Velicham',
    state: 'California',
    city: 'San Francisco',
    address: 'California, USA',
  },
];

async function seedCommunities() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing communities
    await Community.deleteMany({});
    console.log('Cleared existing communities');

    // Insert new communities
    const result = await Community.insertMany(communities);
    console.log(`Successfully seeded ${result.length} communities:`);
    result.forEach((community) => {
      console.log(`  - ${community.name} (${community.communityId})`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding communities:', error);
    process.exit(1);
  }
}

seedCommunities();
