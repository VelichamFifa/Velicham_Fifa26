import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Community } from '../models/Community';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { Prediction } from '../models/Prediction';
import { hashPassword } from '../utils/auth';

dotenv.config();

const communities = [
  {
    Community_ID: '1',
    Name: 'Mens Halaqa 1',
    State: 'Kerala',
    City: 'Kozhikode',
    President_Name: 'Abdul Rahman'
  },
  {
    Community_ID: '2',
    Name: 'Mens Halaqa 2',
    State: 'Kerala',
    City: 'Kozhikode',
    President_Name: 'Ibrahim Khan'
  },
  {
    Community_ID: '3',
    Name: 'Womens Halaqa 1',
    State: 'Kerala',
    City: 'Kozhikode',
    President_Name: 'Zainab Bivi'
  },
  {
    Community_ID: '4',
    Name: 'Womens Halaqa 2',
    State: 'Kerala',
    City: 'Kozhikode',
    President_Name: 'Mariyam Beevi'
  },
  {
    Community_ID: '5',
    Name: 'Youth Halaqa',
    State: 'Kerala',
    City: 'Kozhikode',
    President_Name: 'Yusuf Ali'
  }
];

const users = [
  {
    User_ID: '1',
    Email: 'ahmad@example.com',
    First_Name: 'Ahmad',
    Last_Name: 'Abdullah',
    Status: 'Active',
    WhatsApp_Number: '+919876543210',
    City: 'Kozhikode',
    State: 'Kerala',
    Community_ID: '1',
    password: 'password123'
  },
  {
    User_ID: '2',
    Email: 'omar@example.com',
    First_Name: 'Omar',
    Last_Name: 'Farooq',
    Status: 'Active',
    WhatsApp_Number: '+919876543211',
    City: 'Kozhikode',
    State: 'Kerala',
    Community_ID: '2',
    password: 'password123'
  },
  {
    User_ID: '3',
    Email: 'fatima@example.com',
    First_Name: 'Fatima',
    Last_Name: 'Zahra',
    Status: 'Active',
    WhatsApp_Number: '+919876543212',
    City: 'Kozhikode',
    State: 'Kerala',
    Community_ID: '3',
    password: 'password123'
  },
  {
    User_ID: '4',
    Email: 'khadija@example.com',
    First_Name: 'Khadija',
    Last_Name: 'Noor',
    Status: 'Active',
    WhatsApp_Number: '+919876543213',
    City: 'Kozhikode',
    State: 'Kerala',
    Community_ID: '4',
    password: 'password123'
  },
  {
    User_ID: '5',
    Email: 'yusuf@example.com',
    First_Name: 'Yusuf',
    Last_Name: 'Hassan',
    Status: 'Active',
    WhatsApp_Number: '+919876543214',
    City: 'Kozhikode',
    State: 'Kerala',
    Community_ID: '5',
    password: 'password123'
  }
];

const matches = [
  {
    matchId: '1',
    LDF: 'Left Democratic Front',
    UDF: 'United Democratic Front',
    NDA: 'National Democratic Alliance'
  }
];

const samplePredictions = [
  {
    Email: 'ahmad@example.com',
    User_ID: '1',
    matchId: '1',
    UDF_Score: 75,
    LDF_Score: 45,
    NDA_Score: 20
  },
  {
    Email: 'omar@example.com',
    User_ID: '2',
    matchId: '1',
    UDF_Score: 70,
    LDF_Score: 50,
    NDA_Score: 20
  },
  {
    Email: 'fatima@example.com',
    User_ID: '3',
    matchId: '1',
    UDF_Score: 65,
    LDF_Score: 55,
    NDA_Score: 20
  },
  {
    Email: 'khadija@example.com',
    User_ID: '4',
    matchId: '1',
    UDF_Score: 80,
    LDF_Score: 40,
    NDA_Score: 20
  },
  {
    Email: 'yusuf@example.com',
    User_ID: '5',
    matchId: '1',
    UDF_Score: 60,
    LDF_Score: 60,
    NDA_Score: 20
  }
];

async function seedAll() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_predictor';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Synchronize indexes to remove old 'ID' index
    await Community.syncIndexes();
    console.log('Synchronized Community indexes');

    // Clear existing data
    await Promise.all([
      Community.deleteMany({}),
      User.deleteMany({}),
      Match.deleteMany({}),
      Prediction.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Seed communities
    await Community.insertMany(communities);
    console.log(`Seeded ${communities.length} communities`);

    // Seed users with hashed passwords
    //const usersWithHashedPasswords = await Promise.all(
   //   users.map(async (user) => ({
    //    ...user,
   //     password: await hashPassword(user.password!)
   //   }))
   // );
   // await User.insertMany(usersWithHashedPasswords);
    //console.log(`Seeded ${users.length} users`);

    // Seed matches
    await Match.insertMany(matches);
    console.log(`Seeded ${matches.length} matches`);

    // Seed predictions
    //await Prediction.insertMany(samplePredictions);
    //console.log(`Seeded ${samplePredictions.length} predictions`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Demo Accounts (Password: password123):');
    users.forEach(user => {
      console.log(`  Email: ${user.Email} | Community ID: ${user.Community_ID}`);
    });

    console.log('\n🗳️  Election Match:');
    console.log(`  Match ID: 1`);
    console.log(`  ${matches[0].UDF} vs ${matches[0].LDF} vs ${matches[0].NDA}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedAll();
