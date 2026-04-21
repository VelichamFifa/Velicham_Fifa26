import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Community } from '../models/Community';

dotenv.config();

const communities = [
  // Men Halqa
  {
    Community_ID: '1',
    Name: "Mens's halaqa East 1",
    President_Name: 'Riyas'
  },
  {
    Community_ID: '2',
    Name: "Mens's halaqa East 2",
    President_Name: 'Aman'
  },
  {
    Community_ID: '3',
    Name: "Mens's halaqa East 3",
    President_Name: 'Jumsheed'
  },
  {
    Community_ID: '4',
    Name: "Mens's halaqa West 1",
    President_Name: 'Shine'
  },
  {
    Community_ID: '5',
    Name: "Mens's halaqa West 2",
    President_Name: 'Suhail'
  },
  {
    Community_ID: '6',
    Name: "Mens's halaqa West 3",
    President_Name: 'Riyas'
  },
  {
    Community_ID: '7',
    Name: "Mens's halaqa Physical (Chatham)",
    President_Name: 'Haroon',
    City: 'Chatham'
  },
  // Ladies Halqa
  {
    Community_ID: '8',
    Name: 'Ladies halaqa 1',
    President_Name: 'Saleena'
  },
  {
    Community_ID: '9',
    Name: 'Ladies halaqa 2',
    President_Name: 'Farha'
  },
  {
    Community_ID: '10',
    Name: 'Ladies halaqa 3',
    President_Name: 'Thasni'
  },
  {
    Community_ID: '11',
    Name: 'Ladies halaqa 4',
    President_Name: 'Sayara'
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
