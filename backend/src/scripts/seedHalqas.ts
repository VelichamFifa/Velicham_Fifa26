import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Community } from '../models/Community';

dotenv.config();

const communities = [
  // Men Halqa
  {
    Community_ID: '1',
    Name: "Brothers halaqa East 1",
    President_Name: 'Riyas',
    State: 'New York',
    City: 'New York'
  },
  {
    Community_ID: '2',
    Name: "Brothers halaqa East 2",
    President_Name: 'Aman',
    State: 'New York',
    City: 'New York'
  },
  {
    Community_ID: '3',
    Name: "Brothers halaqa East 3",
    President_Name: 'Jumsheed',
    State: 'New York',
    City: 'Albany'
  },
  {
    Community_ID: '4',
    Name: "Brothers halaqa West 1",
    President_Name: 'Shine',
    State: 'California',
    City: 'Pleasanton'
  },
  {
    Community_ID: '5',
    Name: "Brothers halaqa West 2",
    President_Name: 'Suhail',
    State: 'California',
    City: 'San Jose'
  },
  {
    Community_ID: '6',
    Name: "Brothers halaqa West 3",
    President_Name: 'Riyas',
    State: 'California',
    City: 'San Francisco'
  },
  {
    Community_ID: '7',
    Name: "Brothers halaqa Physical (Chatham)",
    President_Name: 'Haroon',
    City: 'Chatham',
    State: 'Toronto'
  },
  // Ladies Halqa
  {
    Community_ID: '8',
    Name: 'Sisters halaqa 1',
    President_Name: 'Saleena',
    State: 'Edison',
    City: 'New Jersey'
  },
  {
    Community_ID: '9',
    Name: 'Sisters halaqa 2',
    President_Name: 'Farha',
    State: 'Toronto',
    City: 'Toronto'
  },
  {
    Community_ID: '10',
    Name: 'Sisters halaqa 3',
    President_Name: 'Thasni',
    City: 'Albany',
    State: 'New York'
  },
  {
    Community_ID: '11',
    Name: 'Sisters halaqa 4',
    President_Name: 'Sayara',
    City: 'San Francisco',
    State: 'California'
  }
];

async function seedHalqas() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_predictor';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing community data
    await Community.deleteMany({});
    console.log('Cleared existing communities');

    // Insert new halqas
    await Community.insertMany(communities);
    console.log(`Successfully seeded ${communities.length} halqas with numeric IDs 1-11`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding halqas:', error);
    process.exit(1);
  }
}

seedHalqas();
