# Fifa26Predictor - Quick Reference Card

## 🚀 START HERE

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev        # Runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # Runs on http://localhost:3000
```

**Prerequisites:** MongoDB, Redis, Node.js 16+

---

## 📊 Project at a Glance

| Aspect | Details |
|--------|---------|
| **Type** | Full-Stack Web App |
| **Purpose** | FIFA Match Predictions |
| **Users** | Predict scores, compete on leaderboards |
| **Frontend** | React + TypeScript + Tailwind |
| **Backend** | Express + TypeScript |
| **Database** | MongoDB + Redis |
| **Jobs** | BullMQ (Background Tasks) |
| **Auth** | JWT + OAuth Ready |
| **Endpoints** | 20+ RESTful APIs |
| **Files** | 56+ (5000+ LOC) |

---

## 🔑 Key Features

✅ User registration & authentication  
✅ Make predictions on matches  
✅ Automatic score calculation  
✅ Individual leaderboards (All-time & Daily)  
✅ Community leaderboards  
✅ Background job processing  
✅ Redis caching  
✅ Rate limiting  
✅ Responsive design  

---

## 📁 Important Directories

```
backend/src/
├── models/         → Database schemas
├── controllers/    → Business logic
├── routes/         → API endpoints
├── services/       → Scoring, leaderboard, caching
└── jobs/          → Background jobs

frontend/src/
├── components/     → Reusable UI pieces
├── pages/         → Full page components
├── services/      → API client
└── context/       → State management
```

---

## 🔗 API Endpoints Cheat Sheet

### Auth
```
POST   /api/auth/register     - Create account
POST   /api/auth/login        - Login
GET    /api/auth/profile      - Get user info
PUT    /api/auth/profile      - Update profile
```

### Matches
```
GET    /api/matches           - List all matches
GET    /api/matches/:id       - Get match details
POST   /api/matches           - Create match (admin)
PUT    /api/matches/:id       - Update match (admin)
```

### Predictions
```
POST   /api/predictions       - Submit prediction
GET    /api/predictions       - Get your predictions
PUT    /api/predictions/:id   - Update prediction
DELETE /api/predictions/:id   - Delete prediction
```

### Leaderboards
```
GET    /api/leaderboard/top       - Top 30 all-time
GET    /api/leaderboard/daily     - Top 30 today
GET    /api/leaderboard/community - Community ranking
GET    /api/leaderboard/stats     - Your ranking
```

---

## 📝 Scoring Rules

When a match completes:
- **Correct Result** (W/L/D): **5 points**
- **Correct Team 1 Score**: **2 points**
- **Correct Team 2 Score**: **2 points**
- **Correct Goal Difference**: **1 point**
- **Maximum per match**: **10 points**

Example:  
Actual: Brazil 3-1 Germany  
Predicted: Brazil 3-1 Germany  
**Points: 5+2+2+1 = 10** ✅

---

## 🛠️ Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript
npm start           # Run compiled JS
npm run lint        # Check code quality
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview built app
npm run lint        # Check code quality
```
---

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/fifa26predictor
JWT_SECRET=your_secret_key_here
REDIS_URL=redis://localhost:6379
PORT=5000
FRONTEND_URL=http://localhost:3000
```

---

## 📱 User Flow

```
Home Page
    ↓
[Register] or [Login]
    ↓
Dashboard (view matches)
    ↓
Select Match → Make Prediction
    ↓
Submit Prediction
    ↓
Check Leaderboard
    ↓
Earn Points!
```

---

## 🧪 Test the API

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","firstName":"Test","lastName":"User","password":"pass123","city":"NY","state":"NY","country":"USA"}'

# Get token from response, then test protected endpoint
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# List matches (no auth needed)
curl http://localhost:5000/api/leaderboard/top
```

---

## 📊 Database Collections

**10 Collections:**
- `users` - User accounts & profiles
- `matches` - Match info
- `teams` - Team data
- `communities` - Community info
- `predictions` - User predictions
- `results` - Match results & scores
- `communityresults` - Community scores
- `topleaders` - Top 30 leaderboard
- `dailyleaders` - Daily top 30
- `communityleaders` - Community ranking

---

## 🎯 Scoring Service Flow

```
Match Completed
    ↓
BullMQ Job Triggered
    ↓
Calculate Points for each prediction
    ↓
Create Result records
    ↓
Invalidate leaderboard cache
    ↓
Generate new leaderboards
    ↓
Cache in Redis
    ↓
Frontend fetches updated leaderboard
```

---

## 🔒 Security Checklist

✅ JWT tokens (7-day expiration)  
✅ Password hashing (bcryptjs)  
✅ Input validation (Joi)  
✅ Rate limiting (100/15min)  
✅ CORS protection  
✅ Helmet headers  
✅ Protected routes  
✅ One prediction per user per match  

---

## 📚 Documentation Files

| File | Purpose | Size |
|------|---------|------|
| README.md | Full overview | 1700+ lines |
| SETUP.md | Installation guide | 800+ lines |
| API.md | API reference | 1200+ lines |
| DOCKER.md | Container setup | 600+ lines |
| PROJECT_SUMMARY.md | Project overview | 800+ lines |
| FILE_INVENTORY.md | File listing | 500+ lines |

**Read in order:** SETUP → API → README

---

## ⚡ Performance Tips

- ✅ Redis caching (1 hour TTL)
- ✅ MongoDB indexes
- ✅ Vite for fast builds
- ✅ Pagination on endpoints
- ✅ BullMQ for background jobs
- ✅ Lazy loading on frontend

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Kill process on port 3000/5000 |
| MongoDB fails | Check MongoDB is running |
| Redis fails | Check Redis is running |
| npm install errors | `npm cache clean --force` |
| Build fails | Clear `node_modules` & reinstall |

---

## 🎯 Next Steps

1. ✅ **Install & Run** - Get it working locally
2. ✅ **Explore API** - Test endpoints with curl/Postman
3. ✅ **Read Documentation** - Understand architecture
4. ✅ **Modify Code** - Customize scoring, UI, etc.
5. ✅ **Deploy** - Push to production

---

## 📞 Need Help?

- Check documentation in project root
- Read code comments
- Test with provided examples
- Review API.md for endpoint details
- Check SETUP.md for common issues

---

## 🎓 Tech Stack at a Glance

```
Frontend:  React 18 | TypeScript | Tailwind CSS | Vite | Zustand | Axios
Backend:   Express | TypeScript | Mongoose | JWT | Redis | BullMQ
Database:  MongoDB
Auth:      JWT | OAuth Ready (Google, Instagram)
```

---

## 📈 File Stats

- **Total Files:** 56+
- **TypeScript:** 48 files
- **Configuration:** 8 files
- **Total Lines:** 5000+
- **Components:** 4
- **Pages:** 5
- **Endpoints:** 20+

---

## ✨ Project Highlights

⭐ Production-ready code  
⭐ Fully documented  
⭐ TypeScript strict mode  
⭐ Responsive design  
⭐ Security hardened  
⭐ Performance optimized  
⭐ Scalable architecture  
⭐ Easy to customize  

---

**Ready to build?** Start with `npm install` in both directories! 🚀

**Need reference?** Bookmark the documentation files! 📚

**Happy coding!** ⚽🏆
