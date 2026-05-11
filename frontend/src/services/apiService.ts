import axios, { AxiosInstance } from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to all requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  register(data: any) {
    return this.client.post('/auth/register', data);
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  googleLogin(credential: string) {
    return this.client.post('/auth/google', { credential });
  }

  getProfile() {
    return this.client.get('/auth/profile');
  }

  updateProfile(data: any) {
    return this.client.put('/auth/profile', data);
  }

  // Match endpoints
  getAllMatches(status?: string, page?: number, limit?: number) {
    return this.client.get('/matches', {
      params: { status, page, limit },
    });
  }

  getMatch(matchId: string) {
    return this.client.get(`/matches/${matchId}`);
  }

  createMatch(data: any) {
    return this.client.post('/matches', data);
  }

  updateMatch(matchId: string, data: any) {
    return this.client.put(`/matches/${matchId}`, data);
  }

  // Prediction endpoints
  submitPrediction(data: any) {
    return this.client.post('/predictions', data);
  }

  getUserPredictions(page?: number, limit?: number) {
    return this.client.get('/predictions', {
      params: { page, limit },
    });
  }

  updatePrediction(predictionId: string, data: any) {
    return this.client.put(`/predictions/${predictionId}`, data);
  }

  deletePrediction(predictionId: string) {
    return this.client.delete(`/predictions/${predictionId}`);
  }

  // Leaderboard endpoints
  getTopLeaderboard(limit?: number) {
    return this.client.get('/leaderboard/top', { params: { limit } });
  }

  getDailyLeaderboard(limit?: number, date?: string) {
    return this.client.get('/leaderboard/daily', { params: { limit, date } });
  }

  getCommunityLeaderboard(limit?: number) {
    return this.client.get('/leaderboard/community', { params: { limit } });
  }

  getDailyCommunityLeaderboard(limit?: number, date?: string) {
    return this.client.get('/leaderboard/community/daily', { params: { limit, date } });
  }

  getUserStats() {
    return this.client.get('/leaderboard/stats');
  }

  // Community endpoints
  getCommunities() {
    return this.client.get('/communities');
  }

  getCommunity(communityId: string) {
    return this.client.get(`/communities/${communityId}`);
  }
}

export const apiService = new ApiService();
