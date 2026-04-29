# Fifa26Predictor API Documentation

## Base URL below 
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "whatsappNumber": "+1234567890",
  "communityId1": "comm_001",
  "communityId2": "comm_002"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "user_1704067200000_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "communityId1": "comm_001",
    "communityId2": "comm_002"
  }
}
```

**Validation Rules:**
- Email: Required, valid email format, unique
- Password: Minimum 6 characters
- First/Last Name: Minimum 2 characters
- Communities: Optional, must exist in database

---

### Login User
Authenticate and get JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "user_1704067200000_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "communityId1": "comm_001",
    "communityId2": "comm_002"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email or password

---

### Get User Profile
Retrieve current user's profile information.

**Endpoint:** `GET /auth/profile`  
**Authentication:** Required

**Response (200):**
```json
{
  "userId": "user_1704067200000_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "communityId1": "comm_001",
  "communityId2": "comm_002",
  "whatsappNumber": "+1234567890",
  "status": "active",
  "isActive": true
}
```

---

### Update User Profile
Update user's profile information.

**Endpoint:** `PUT /auth/profile`  
**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "whatsappNumber": "+9876543210",
  "communityId1": "comm_002",
  "communityId2": "comm_003"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "userId": "user_1704067200000_abc123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "communityId1": "comm_002",
    "communityId2": "comm_003"
  }
}
```

---

## Match Endpoints

### List All Matches
Get paginated list of all matches with optional filtering.

**Endpoint:** `GET /matches`

**Query Parameters:**
- `status` (optional): `scheduled`, `ongoing`, or `completed`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /matches?status=scheduled&page=1&limit=10
```

**Response (200):**
```json
{
  "matches": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "matchId": "match_001",
      "sequence": 1,
      "team1": "Brazil",
      "team2": "Argentina",
      "matchTime": "2024-02-01T20:00:00.000Z",
      "predictionsEndingTime": "2024-02-01T19:00:00.000Z",
      "round": 1,
      "matchTag": "Final",
      "status": "scheduled",
      "comment": "Title match"
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

### Get Match Details
Retrieve details of a specific match.

**Endpoint:** `GET /matches/:matchId`

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "matchId": "match_001",
  "sequence": 1,
  "team1": "Brazil",
  "team2": "Argentina",
  "team1Score": 2,
  "team2Score": 1,
  "matchTime": "2024-02-01T20:00:00.000Z",
  "predictionsEndingTime": "2024-02-01T19:00:00.000Z",
  "round": 1,
  "matchTag": "Final",
  "status": "completed",
  "comment": "Title match"
}
```

---

### Create Match
Create a new match (admin only).

**Endpoint:** `POST /matches`  
**Authentication:** Required

**Request Body:**
```json
{
  "matchId": "match_002",
  "sequence": 2,
  "team1": "France",
  "team2": "Germany",
  "matchTime": "2024-02-05T20:00:00Z",
  "predictionsEndingTime": "2024-02-05T19:00:00Z",
  "round": 2,
  "matchTag": "Semi-Final",
  "comment": "European clash"
}
```

**Response (201):**
```json
{
  "message": "Match created successfully",
  "match": {
    "matchId": "match_002",
    "sequence": 2,
    "team1": "France",
    "team2": "Germany",
    "matchTime": "2024-02-05T20:00:00.000Z",
    "predictionsEndingTime": "2024-02-05T19:00:00.000Z",
    "round": 2,
    "matchTag": "Semi-Final",
    "status": "scheduled"
  }
}
```

---

### Update Match
Update match details (admin only).

**Endpoint:** `PUT /matches/:matchId`  
**Authentication:** Required

**Request Body:**
```json
{
  "team1Score": 3,
  "team2Score": 2,
  "status": "completed"
}
```

**Response (200):**
```json
{
  "message": "Match updated successfully",
  "match": {
    "matchId": "match_001",
    "team1": "Brazil",
    "team2": "Argentina",
    "team1Score": 3,
    "team2Score": 2,
    "status": "completed"
  }
}
```

---

## Prediction Endpoints

### Submit Prediction
Create a prediction for a match.

**Endpoint:** `POST /predictions`  
**Authentication:** Required

**Request Body:**
```json
{
  "matchId": "match_001",
  "team1Score": 2,
  "team2Score": 1,
  "comment": "Brazil will dominate"
}
```

**Response (201):**
```json
{
  "message": "Prediction submitted successfully",
  "prediction": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "user_1704067200000_abc123",
    "email": "user@example.com",
    "matchId": "match_001",
    "matchTag": "Final",
    "team1Score": 2,
    "team2Score": 1,
    "submittedTime": "2024-02-01T18:30:00.000Z",
    "points": 0,
    "comment": "Brazil will dominate"
  }
}
```

**Validation Rules:**
- Prediction deadline must not have passed
- User can only have one prediction per match
- Scores must be between 0 and 20

**Error Responses:**
- `400 Bad Request`: Deadline passed or already predicted
- `404 Not Found`: Match not found

---

### Get User Predictions
Retrieve all predictions made by the current user.

**Endpoint:** `GET /predictions`  
**Authentication:** Required

**Query Parameters:**
- `matchId` (optional): Filter by specific match
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "predictions": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "user_1704067200000_abc123",
      "matchId": "match_001",
      "matchTag": "Final",
      "team1Score": 2,
      "team2Score": 1,
      "submittedTime": "2024-02-01T18:30:00.000Z",
      "points": 5
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

---

### Update Prediction
Modify an existing prediction (before deadline).

**Endpoint:** `PUT /predictions/:predictionId`  
**Authentication:** Required

**Request Body:**
```json
{
  "team1Score": 3,
  "team2Score": 0,
  "comment": "Brazil will crush Argentina"
}
```

**Response (200):**
```json
{
  "message": "Prediction updated successfully",
  "prediction": {
    "_id": "507f1f77bcf86cd799439012",
    "matchId": "match_001",
    "team1Score": 3,
    "team2Score": 0
  }
}
```

---

### Delete Prediction
Remove a prediction (before deadline).

**Endpoint:** `DELETE /predictions/:predictionId`  
**Authentication:** Required

**Response (200):**
```json
{
  "message": "Prediction deleted successfully"
}
```

---

## Leaderboard Endpoints

### Get Top Leaderboard
Retrieve all-time top 30 leaders.

**Endpoint:** `GET /leaderboard/top`

**Query Parameters:**
- `limit` (optional): Number of results (default: 30)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "totalPoints": 450,
      "name": "John Doe",
      "state": "NY",
      "community1": "comm_001",
      "community2": "comm_002",
      "userId": "user_001",
      "email": "john@example.com"
    },
    {
      "rank": 2,
      "totalPoints": 420,
      "name": "Jane Smith",
      "state": "CA",
      "community1": "comm_001",
      "userId": "user_002",
      "email": "jane@example.com"
    }
  ],
  "source": "cache"
}
```

---

### Get Daily Leaderboard
Retrieve today's top 30 leaders.

**Endpoint:** `GET /leaderboard/daily`

**Query Parameters:**
- `limit` (optional): Number of results (default: 30)
- `date` (optional): Specific date (YYYY-MM-DD format)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "totalPoints": 50,
      "name": "John Doe",
      "state": "NY",
      "community1": "comm_001",
      "userId": "user_001",
      "email": "john@example.com",
      "date": "2024-02-01T00:00:00.000Z"
    }
  ],
  "source": "cache"
}
```

---

### Get Community Leaderboard
Retrieve community rankings.

**Endpoint:** `GET /leaderboard/community`

**Query Parameters:**
- `limit` (optional): Number of results (default: 30)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "totalPoints": 1250,
      "communityName": "Football Enthusiasts",
      "communityId": "comm_001"
    },
    {
      "rank": 2,
      "totalPoints": 1100,
      "communityName": "Soccer Legends",
      "communityId": "comm_002"
    }
  ],
  "source": "cache"
}
```

---

### Get User Stats
Retrieve current user's ranking statistics.

**Endpoint:** `GET /leaderboard/stats`  
**Authentication:** Required

**Response (200):**
```json
{
  "overall": {
    "rank": 5,
    "totalPoints": 380,
    "name": "John Doe",
    "state": "NY"
  },
  "daily": {
    "rank": 3,
    "totalPoints": 45,
    "name": "John Doe",
    "state": "NY"
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

---

## Rate Limiting

All endpoints are rate-limited to:
- **100 requests per 15 minutes** per IP address

Rate limit headers included in responses:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1704067900
```

---

## Scoring Rules

Points are awarded when a match is completed:

| Prediction | Points |
|-----------|--------|
| Correct result (W/L/D) | 5 |
| Correct Team 1 score | 2 |
| Correct Team 2 score | 2 |
| Correct goal difference | 1 |
| **Maximum** | **10** |

### Example Calculation

```
Actual result: Brazil 3 - 1 Germany
Your prediction: Brazil 3 - 1 Germany

✅ Correct result: +5 points
✅ Brazil score (3): +2 points
✅ Germany score (1): +2 points
✅ Goal difference (3-1=2): +1 point
────────────────────────────
Total: 10 points
```

---

## Community Scoring

Community score is calculated as the **average of all member predictions** for each match:

```
Community Score = Sum of member prediction points / Number of members
```

Community leaderboard is updated after each match completion.

---

## Response Caching

Leaderboard endpoints use Redis caching:
- **Cache duration:** 1 hour (3600 seconds)
- **Invalidation:** Automatic when scores are updated
- **Cache key format:** `leaderboard:{type}:{limit}`

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123",
    "city": "NYC",
    "state": "NY",
    "country": "USA"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Make Prediction (using token from login)
```bash
curl -X POST http://localhost:5000/api/predictions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "matchId": "match_001",
    "team1Score": 2,
    "team2Score": 1
  }'
```

### Get Leaderboard
```bash
curl http://localhost:5000/api/leaderboard/top?limit=10
```

---

## Postman Collection

Import this collection into Postman for easy API testing:

[Create Postman collection from this documentation]

---

## Rate Limiting Info
- Window: 15 minutes
- Max requests: 100
- Applies to: All `/api/*` routes

---

**Last Updated:** February 2024  
**API Version:** 1.0.0
