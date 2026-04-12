"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Community_1 = __importDefault(require("../src/models/Community"));
const User_1 = __importDefault(require("../src/models/User"));
const Match_1 = __importDefault(require("../src/models/Match"));
const Prediction_1 = __importDefault(require("../src/models/Prediction"));
const auth_1 = require("../src/utils/auth");
dotenv_1.default.config();
const communities = [
    {
        ID: 1,
        Name: 'Thiruvananthapuram Youth Association',
        State: 'Kerala',
        City: 'Thiruvananthapuram',
        President_Name: 'Raju Thomas'
    },
    {
        ID: 2,
        Name: 'Kochi Community Forum',
        State: 'Kerala',
        City: 'Kochi',
        President_Name: 'Sujith Nair'
    },
    {
        ID: 3,
        Name: 'Kozhikode Cultural Society',
        State: 'Kerala',
        City: 'Kozhikode',
        President_Name: 'Firoz K'
    },
    {
        ID: 4,
        Name: 'Thrissur Devotees Group',
        State: 'Kerala',
        City: 'Thrissur',
        President_Name: 'Ajith Kumar'
    },
    {
        ID: 5,
        Name: 'Palakkad Farmers Association',
        State: 'Kerala',
        City: 'Palakkad',
        President_Name: 'Venu Gopal'
    }
];
const users = [
    {
        User_ID: 1,
        Email: 'john@example.com',
        First_Name: 'John',
        Last_Name: 'Jacob',
        Status: 'Active',
        WhatsApp_Number: '+919876543210',
        City: 'Thiruvananthapuram',
        State: 'Kerala',
        Community_ID: 1,
        password: 'password123'
    },
    {
        User_ID: 2,
        Email: 'sara@example.com',
        First_Name: 'Sara',
        Last_Name: 'Thomas',
        Status: 'Active',
        WhatsApp_Number: '+919876543211',
        City: 'Kochi',
        State: 'Kerala',
        Community_ID: 2,
        password: 'password123'
    },
    {
        User_ID: 3,
        Email: 'mike@example.com',
        First_Name: 'Mike',
        Last_Name: 'Philip',
        Status: 'Active',
        WhatsApp_Number: '+919876543212',
        City: 'Kozhikode',
        State: 'Kerala',
        Community_ID: 3,
        password: 'password123'
    },
    {
        User_ID: 4,
        Email: 'anna@example.com',
        First_Name: 'Anna',
        Last_Name: 'George',
        Status: 'Active',
        WhatsApp_Number: '+919876543213',
        City: 'Thrissur',
        State: 'Kerala',
        Community_ID: 4,
        password: 'password123'
    },
    {
        User_ID: 5,
        Email: 'david@example.com',
        First_Name: 'David',
        Last_Name: 'Mathew',
        Status: 'Active',
        WhatsApp_Number: '+919876543214',
        City: 'Palakkad',
        State: 'Kerala',
        Community_ID: 5,
        password: 'password123'
    }
];
const matches = [
    {
        ID: 1,
        LDF: 'Left Democratic Front',
        UDF: 'United Democratic Front',
        NDA: 'National Democratic Alliance'
    }
];
async function seedAll() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_predictor';
        await mongoose_1.default.connect(mongoURI);
        console.log('Connected to MongoDB');
        // Clear existing data
        await Promise.all([
            Community_1.default.deleteMany({}),
            User_1.default.deleteMany({}),
            Match_1.default.deleteMany({}),
            Prediction_1.default.deleteMany({})
        ]);
        console.log('Cleared existing data');
        // Seed communities
        await Community_1.default.insertMany(communities);
        console.log(`Seeded ${communities.length} communities`);
        // Seed users with hashed passwords
        const usersWithHashedPasswords = await Promise.all(users.map(async (user) => ({
            ...user,
            password: await (0, auth_1.hashPassword)(user.password)
        })));
        await User_1.default.insertMany(usersWithHashedPasswords);
        console.log(`Seeded ${users.length} users`);
        // Seed matches
        await Match_1.default.insertMany(matches);
        console.log(`Seeded ${matches.length} matches`);
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Demo Accounts (Password: password123):');
        users.forEach(user => {
            console.log(`  Email: ${user.Email} | Community ID: ${user.Community_ID}`);
        });
        console.log('\n🗳️  Election Match:');
        console.log(`  Match ID: 1`);
        console.log(`  ${matches[0].UDF} vs ${matches[0].LDF} vs ${matches[0].NDA}`);
        await mongoose_1.default.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        await mongoose_1.default.connection.close();
        process.exit(1);
    }
}
seedAll();
//# sourceMappingURL=seedLeaderboards.js.map