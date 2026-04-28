# Fifa26Predictor - Full Stack Web Application

A complete football prediction platform where users can make predictions on FIFA matches, compete on leaderboards individually and with communities, and earn points based on prediction accuracy.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend:** React 18+, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT, Google OAuth, Instagram OAuth

## 📁 Project Structure

```
Fifa26Predictor/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── context/         # State management (Zustand)
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                  # Express API
    ├── src/
    │   ├── config/          # Configuration files
    │   ├── models/          # Mongoose schemas
    │   ├── controllers/      # Business logic
    │   ├── routes/          # API endpoints
    │   ├── middleware/      # Auth, error handling
    │   ├── services/        # Services (scoring, leaderboard)
    │   ├── jobs/            # Background job utilities
    │   ├── utils/           # Utilities (auth, validation)
    │   ├── app.ts           # Express app setup
    │   └── index.ts         # Entry point
    ├── package.json
    └── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (16+)
- MongoDB (local or Atlas)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```
   Update with your credentials:
   ```env
   MONGODB_URI=mongodb://localhost:27017/fifa26predictor
   JWT_SECRET=your_secret_key_here
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   INSTAGRAM_CLIENT_ID=your_instagram_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_secret
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📊 Database Models

### User
- User ID, Email, First Name, Last Name
- Location (City, State, Country)
- Community affiliations (max 2)
- Social auth IDs (Google, Instagram)
- Status tracking (active/inactive/suspended)

### Match
- Match ID, Sequence, Team 1/2
- Match time, Prediction deadline
- Round number, Status (scheduled/ongoing/completed)
- Final scores (when completed)

### Prediction
- User ID, Match ID
- Predicted Team 1/2 scores
- Submission timestamp
- Points earned

### Result
- User ID, Match ID
- Match result, Points earned
- Community affiliations
- Ranking data

### Community
- Community ID, Name
- Location (State, City, Address)
- Member tracking

### Leaderboard Views
- **TopLeader:** All-time rankings (materialized view)
- **DailyLeader:** Daily rankings (updated daily)
- **CommunityLeader:** Community rankings
- **DailyCommunityLeader:** Daily community rankings

## 📋 Scoring System

Points are calculated based on prediction accuracy:
- **Correct Result:** 5 points (predicted win/loss/draw correctly)
- **Correct Team 1 Score:** 2 points
- **Correct Team 2 Score:** 2 points
- **Correct Goal Difference:** 1 point
- **Maximum per prediction:** 10 points

Community score is the **average of all member predictions**.

## 🔐 Authentication

### JWT Authentication
- Token-based auth with 7-day expiration
- Stored in localStorage (frontend)
- Sent via Authorization header in all requests

### Social Authentication (Planned)
- Google OAuth 2.0
- Instagram OAuth 2.0
- Seamless account linking

## 🏆 Leaderboard Features

### Individual Leaderboards
1. **Top Leaders:** All-time rankings of top 30 users
2. **Daily Leaders:** Today's top 30 performers
3. **Fresh Data:** Queried directly from MongoDB on each request

### Community Leaderboards
1. **Community Leaders:** Rankings of communities
2. **Community Score Calculation:** Average of member points
3. **Support for user affiliation with 2 communities**

## ⚙️ Background Job Processing

### Score Calculation
- Processes completed matches
- Calculates user points
- Updates Result collection
- Triggers leaderboard refresh

### Leaderboard Generation
- Generates Top, Daily, and Community leaderboards
- Updates materialized views in database
- Queried on demand from MongoDB

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Matches
- `GET /api/matches` - List matches (pagination, filtering)
- `GET /api/matches/:matchId` - Get match details
- `POST /api/matches` - Create match (admin)
- `PUT /api/matches/:matchId` - Update match (admin)

### Predictions
- `POST /api/predictions` - Submit prediction (protected)
- `GET /api/predictions` - Get user predictions (protected)
- `PUT /api/predictions/:predictionId` - Update prediction (protected)
- `DELETE /api/predictions/:predictionId` - Delete prediction (protected)

### Leaderboard
- `GET /api/leaderboard/top` - Top 30 all-time leaders
- `GET /api/leaderboard/daily` - Top 30 daily leaders
- `GET /api/leaderboard/community` - Community rankings
- `GET /api/leaderboard/stats` - User's ranking stats (protected)

## 📱 Frontend Features

### Pages
1. **Home** - Landing page with feature overview
2. **Login/Register** - Authentication with social options
3. **Dashboard** - User's predictions and match list
4. **Leaderboard** - Multiple leaderboard views
5. **Profile** - User information and settings

### Components
- **Header** - Navigation and auth status
- **MatchCard** - Match display with prediction button
- **Leaderboard** - Reusable leaderboard table
- **PredictionForm** - Modal prediction submission form

### State Management
- **Zustand** for auth state (token, user info)
- **Axios** for API requests with auth interceptors
- **LocalStorage** for token persistence

## 🔒 Security Features

### Input Validation
- Joi schema validation on backend
- Email format validation
- Score range validation (0-20)

### Authentication
- JWT with secret key
- Password hashing (bcryptjs)
- Protected routes with auth middleware

### Rate Limiting
- 100 requests per 15 minutes
- Applies to all API endpoints
- Prevents brute force attacks

### Error Handling
- Centralized error middleware
- User-friendly error messages
- Request validation before processing

## 📈 Performance Optimization

### Database Optimization
- Indexes on frequently queried fields
- Compound indexes (userId, matchId)
- Aggregation pipelines for leaderboard calculations
- MongoDB materialized views (TopLeader, DailyLeader collections)

### Frontend Optimization
- Code splitting with React Router
- Vite for fast development and builds
- Lazy loading of components

## 📝 Environment Variables

### Backend (.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/fifa26predictor

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

### Backend Testing (To be implemented)
```bash
npm run test
```

### Frontend Testing (To be implemented)
```bash
npm run test
```

## 📦 Build & Deployment

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or Atlas connection is valid
- Check `MONGODB_URI` in .env

### CORS Error
- Verify `FRONTEND_URL` in backend .env matches actual frontend URL
- Check CORS middleware in app.ts

### Token Expired
- Frontend automatically redirects to login on 401 response
- Clear localStorage and re-login if issues persist

## 🔄 Future Enhancements

1. **Social Features**
   - User profiles and follow system
   - Prediction comments and discussions
   - Match replays and analysis

2. **Advanced Scoring**
   - Custom scoring rules per tournament
   - Bonus points for streaks
   - Season-based competitions

3. **Mobile App**
   - React Native version
   - Push notifications
   - Offline predictions

4. **Analytics**
   - Prediction accuracy statistics
   - Performance trends
   - Community insights

5. **Admin Dashboard**
   - User management
   - Match management
   - Leaderboard management
   - Analytics and reports

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 💡 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ for football enthusiasts worldwide**
