import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Team } from '../src/models';

dotenv.config();

const teams = [
  // Group A
  { teamId: 'ARG', teamName: 'Argentina', country: 'Argentina', coach: 'Lionel Scaloni', foundedYear: 1901 },
  { teamId: 'PER', teamName: 'Peru', country: 'Peru', coach: 'TBD', foundedYear: 1930 },
  { teamId: 'CHI', teamName: 'Chile', country: 'Chile', coach: 'Ricardo Gareca', foundedYear: 1895 },
  { teamId: 'CAN', teamName: 'Canada', country: 'Canada', coach: 'Jesse Marsch', foundedYear: 1912 },

  // Group B
  { teamId: 'MEX', teamName: 'Mexico', country: 'Mexico', coach: 'Javier Aguirre', foundedYear: 1927 },
  { teamId: 'ECU', teamName: 'Ecuador', country: 'Ecuador', coach: 'Félix Sánchez', foundedYear: 1925 },
  { teamId: 'VEN', teamName: 'Venezuela', country: 'Venezuela', coach: 'Fernando Batista', foundedYear: 1926 },
  { teamId: 'JAM', teamName: 'Jamaica', country: 'Jamaica', coach: 'Heimir Hallgrímsson', foundedYear: 1910 },

  // Group C
  { teamId: 'BRA', teamName: 'Brazil', country: 'Brazil', coach: 'Dorival Júnior', foundedYear: 1914 },
  { teamId: 'COL', teamName: 'Colombia', country: 'Colombia', coach: 'Néstor Lorenzo', foundedYear: 1924 },
  { teamId: 'PAR', teamName: 'Paraguay', country: 'Paraguay', coach: 'Daniel Garnero', foundedYear: 1906 },
  { teamId: 'CRC', teamName: 'Costa Rica', country: 'Costa Rica', coach: 'Gustavo López', foundedYear: 1921 },

  // Group D
  { teamId: 'URY', teamName: 'Uruguay', country: 'Uruguay', coach: 'Marcelo Bielsa', foundedYear: 1900 },
  { teamId: 'BOL', teamName: 'Bolivia', country: 'Bolivia', coach: 'Antonio Carlos Zago', foundedYear: 1925 },
  { teamId: 'USA', teamName: 'USA', country: 'United States', coach: 'Gregg Berhalter', foundedYear: 1913 },
  { teamId: 'PAN', teamName: 'Panama', country: 'Panama', coach: 'Thomas Christiansen', foundedYear: 1937 },
];

async function seedTeams() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing teams
    await Team.deleteMany({});
    console.log('Cleared existing teams');

    // Insert new teams
    const result = await Team.insertMany(teams);
    console.log(`Successfully seeded ${result.length} FIFA 26 qualified teams:`);
    result.forEach((team) => {
      console.log(`  - ${team.teamName} (${team.teamId}) - ${team.country}`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding teams:', error);
    process.exit(1);
  }
}

seedTeams();
