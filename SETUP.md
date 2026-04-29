# Fifa26Predictor - Setup & Installation Guide

## Quick Start

### 1. Clone/Navigate to Project
```bash
cd Fifa26Predictor
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your settings
# - MongoDB URI
# - JWT Secret
# - Redis URL
# - OAuth credentials (optional for now)

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Prerequisites

### Required Services
1. **MongoDB**
   - Local: `mongod` service
   - Or MongoDB Atlas: Update `MONGODB_URI` in .env

2. **Redis**
   - Local: `redis-server` service
   - Or Redis Cloud: Update `REDIS_URL` in .env

3. **Node.js** (v16+)

### Optional - Social Authentication
- Google OAuth: Get credentials from Google Cloud Console
- Instagram OAuth: Get credentials from Instagram Developer

## Environment Setup

### Windows

**MongoDB:**
```powershell
# Install MongoDB Community Edition from https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/

# Verify connection
mongo.exe --version
```

**Redis (Removed):**

Redis has been removed from this project. All leaderboards now query MongoDB directly.

### macOS

**MongoDB:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start service
brew services start mongodb-community
```

**Redis:**
```bash
# Using Homebrew
brew install redis

# Start service
brew services start redis
```

### Linux (Ubuntu/Debian)

**MongoDB:**
```bash
sudo apt-get install -y mongodb

# Start service
sudo systemctl start mongodb
```

**Redis:**
```bash
sudo apt-get install -y redis-server

# Start service
sudo systemctl start redis-server
```

## Initial Data Setup

### Create Sample Data (Optional)

After starting the backend, you can create sample data:

```bash
# Create via API or MongoDB Compass
# Example: Create a community
POST /api/community
{
  "communityId": "comm_001",
  "name": "Football Enthusiasts",
  "state": "California",
  "city": "Los Angeles",
  "address": "Downtown LA"
}

# Create a match
POST /api/matches
{
  "matchId": "match_001",
  "sequence": 1,
  "team1": "Brazil",
  "team2": "Argentina",
  "matchTime": "2024-02-01T20:00:00Z",
  "predictionsEndingTime": "2024-02-01T19:00:00Z",
  "round": 1,
  "matchTag": "Final",
  "status": "scheduled"
}
```

## Verifying Installation

### Check Backend
```bash
curl http://localhost:5000/health
# Expected response: { "status": "ok", "timestamp": "..." }
```

### Check Frontend
- Open http://localhost:3000
- Should see the Fifa26Predictor home page

### Check MongoDB
```bash
# Using MongoDB Compass or CLI
mongosh
use fifa26predictor
show collections
```

### Check Redis
```bash
redis-cli
ping
# Expected response: PONG
```

## Troubleshooting

### Port Already in Use
```bash
# Frontend (3000)
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Backend (5000)
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### MongoDB Connection Failed
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in .env is correct
- For Atlas, ensure IP whitelist includes your IP

### Redis Connection Failed
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in .env is correct
- Default should be `redis://localhost:6379`

### npm install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Development Workflow

### Making Predictions (Demo)

1. Register an account at http://localhost:3000/register
2. Login with your credentials
3. Go to Dashboard
4. Find an upcoming match
5. Click "Make Prediction"
6. Enter score predictions
7. Submit

### Testing Backend API

Using curl or Postman:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "password123",
    "city": "NY",
    "state": "NY",
    "country": "USA"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get top leaderboard
curl http://localhost:5000/api/leaderboard/top
```

## Useful Commands

### Backend
```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Linting
npm run lint
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## Next Steps

1. **Customize Scoring Rules:**
   - Edit `calculatePredictionPoints()` in `backend/src/services/scoringService.ts`

2. **Add Social Authentication:**
   - Get OAuth credentials from Google/Instagram
   - Update .env with credentials
   - Implement OAuth routes in backend

3. **Deploy:**
   - Backend: Heroku, AWS, or DigitalOcean
   - Frontend: Vercel, Netlify, or AWS S3
   - Database: MongoDB Atlas (cloud)
   - Cache: Redis Cloud or AWS ElastiCache

4. **Customize Theme:**
   - Edit `tailwind.config.js` colors
   - Modify components in `frontend/src/components`

## Need Help?

Check the main README.md for:
- Complete API documentation
- Architecture overview
- Database schema details
- Security features
- Future enhancements

---

**Happy predicting! 🏆⚽**
