import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

  getMatchById(matchId: string) {
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

  getUserPredictions(params?: { email?: string; matchId?: string; page?: number; limit?: number }) {
    return this.client.get('/predictions', {
      params,
    });
  }

  updatePrediction(predictionId: string, data: any) {
    return this.client.put(`/predictions/${predictionId}`, data);
  }

  deletePrediction(predictionId: string) {
    return this.client.delete(`/predictions/${predictionId}`);
  }

  // Leaderboard endpoints
  getTopLeaderboard(limit?: number, matchId?: string) {
    return this.client.get('/leaderboard/top', { params: { limit, matchId } });
  }

  getDailyLeaderboard(limit?: number, date?: string) {
    return this.client.get('/leaderboard/daily', { params: { limit, date } });
  }

  getCommunityLeaderboard(limit?: number, matchId?: string) {
    return this.client.get('/leaderboard/community', { params: { limit, matchId } });
  }

  getDailyCommunityLeaderboard(limit?: number, date?: string) {
    return this.client.get('/leaderboard/community/daily', { params: { limit, date } });
  }

  getCommunityRanking(communityId: string, isDaily: boolean = false) {
    return this.client.get(`/leaderboard/ranking/community/${communityId}`, { params: { isDaily } });
  }

  getUserStats() {
    return this.client.get('/leaderboard/stats');
  }

  // Admin endpoints
  getCommunityRequests() {
    return this.client.get('/admin/community-requests');
  }

  approveCommunity(data: { userId: string, communityId: string }) {
    return this.client.post('/admin/approve-community', data);
  }

  createAndApproveCommunity(data: { userId: string; name: string; fullName?: string; state?: string; city?: string; address?: string; isOnline?: boolean; shortName?: string; description?: string }) {
    return this.client.post('/admin/create-and-approve-community', data);
  }

  rejectCommunity(data: { userId: string }) {
    return this.client.post('/admin/reject-community', data);
  }

  finalizeMatch(data: { matchId: string, official_UDF: number, official_LDF: number, official_NDA: number }) {
    return this.client.post('/admin/finalize-match', data);
  }

  getAllUsers() {
    return this.client.get('/admin/users');
  }

  deleteUser(userId: string) {
    return this.client.delete(`/admin/users/${userId}`);
  }

  updateUser(userId: string, data: { role?: string; Community_ID?: string }) {
    return this.client.put(`/admin/users/${userId}`, data);
  }

  // Community endpoints
  getCommunities() {
    return this.client.get('/communities');
  }

  getCommunity(communityId: string) {
    return this.client.get(`/communities/${communityId}`);
  }

  getCommunityMembers(communityId: string) {
    return this.client.get(`/communities/${communityId}/members`);
  }
}

export const apiService = new ApiService();
