# Kerala Election Predictor 2026  

A full-stack web application for predicting Kerala Assembly election results with community leaderboards and scoring system.

## Features

- **User Authentication**: JWT-based authentication with 7-day token expiration
- **Prediction System**: Submit seat allocation predictions for UDF, LDF, and NDA
- **Real-time Leaderboards**:
  - Individual rankings by total points
  - Community rankings by average accuracy
- **Scoring Algorithm**: Up to 20 points per prediction based on:
  - Correct winner/runner-up/third-place (+5 each)
  - Accurate seat count predictions (±5% tolerance, +5 each)
- **Kerala-themed UI**: green color scheme reflecting Kerala's identity
- **Community Engagement**: Users assigned to communities with presidents

## Tech Stack

**Backend**: Node.js + Express + TypeScript + MongoDB + Mongoose + JWT
**Frontend**: React + TypeScript + Vite + Tailwind CSS + Zustand + Axios + React Router

## Project Structure

```
kerala-election-predictor/
├── backend/
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── scripts/seedLeaderboards.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── package.json (root)
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB 6+ (running locally or MongoDB Atlas)
- npm or yarn

## Quick Start

### 1. Clone and Setup

```bash
# Install dependencies for all projects
npm run install-all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/election_predictor
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start MongoDB

```bash
# If MongoDB is installed locally:
mongod
# Or use Docker:
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### 4. Seed Database

```bash
cd backend
npm run seed:leaderboards
```

This creates:
- 5 sample communities in Kerala
- 5 sample users (with any password for demo)
- 1 sample election match

### 5. Run Development Servers

In two separate terminals, or from root:

```bash
# From root - runs both backend and frontend
npm run dev

# Or manually:
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Communities
- `GET /api/communities` - List communities (with search, filter)
- `GET /api/communities/:id` - Get community by ID

### Predictions
- `POST /api/predictions` - Submit/update prediction (requires auth)
- `GET /api/predictions?email=X&matchId=Y` - Get user's predictions

### Leaderboard
- `GET /api/leaderboard?matchId=X&communityId=Y` - Get rankings (optional community filter)

### Matches (Admin)
- `POST /api/match` - Create election match
- `POST /api/match/finalize` - Finalize match & calculate scores

## Demo Credentials

After seeding, use any of these emails (password: any):
- `john@example.com`
- `sara@example.com`
- `mike@example.com`
- `anna@example.com`
- `david@example.com`

## Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build

# Start production server
cd backend
NODE_ENV=production npm start
```

## Environment Variables

**Backend** (`backend/.env`):
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - environment (development/production)
- `JWT_SECRET` - Secret for JWT signing (CHANGE IN PRODUCTION)

## Scoring Rules

Each prediction can earn up to 20 points:

1. **Rank Predictions** (+5 each, max +15):
   - Correctly predict 1st place party
   - Correctly predict 2nd place party
   - Correctly predict 3rd place party

2. **Seat Count Predictions** (+5 each, max +5):
   - Party's predicted seats within ±5% of actual result

Example: If the actual results are UDF: 45%, LDF: 40%, NDA: 15%
- Predictions: UDF: 45%, LDF: 38%, NDA: 17% would earn:
  - UDF 1st place correct: +5
  - LDF 2nd place correct: +5
  - NDA 3rd place correct: +5
  - UDF seat count exact: +5
  - LDF seat within ±5%: +5
  - NDA seat within ±5%: +5
  - **Total: 26 capped at 20**

## Database Schema

### Communities
- `ID` - Unique identifier
- `Name` - Community name
- `State`, `City` - Location
- `President_Name` - Community leader

### Users
- `User_ID` - Unique ID
- `Email` - Login & lookup
- Personal details: `First_Name`, `Last_Name`, `WhatsApp_Number`, `City`, `State`, `Country`
- `Community_ID` - Foreign key to community
- `Status` - Active/Inactive

### Matches
- `ID` - Unique match identifier
- `LDF`, `UDF`, `NDA` - Alliance names
- `IsFinalized` - Whether results are finalized
- `Official_*` - Final official results (percentages)
- `FinalizedAt` - Timestamp of finalization

### Predictions
- `Email` + `MatchID` - Composite key
- `UDF_Score`, `LDF_Score`, `NDA_Score` - User predictions (percentages summing to 100)
- `Total_Points` - Calculated after match finalization
- `Last_Submitted_Time` - Timestamp

## Future Enhancements

- [ ] Admin panel for managing matches and users
- [ ] Google OAuth 2.0 integration
- [ ] Real-time updates with WebSocket
- [ ] Email notifications when match finalized
- [ ] Mobile app (React Native)
- [ ] Historical data analysis
- [ ] Multi-state support

## License

MIT

---

Built with ❤️ for Kerala's democratic process
