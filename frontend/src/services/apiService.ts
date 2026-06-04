import axios, { AxiosInstance } from 'axios';


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? '/api'
    : 'https://fifa-aps-dpbpdfgjdycdhcbe.eastus-01.azurewebsites.net/api');

/** Append Azure Functions host key when VITE_AZURE_FUNCTIONS_KEY is set. */
function withFunctionsKey(url: string): string {
  const key = import.meta.env.VITE_AZURE_FUNCTIONS_KEY as string | undefined;
  if (!key?.trim()) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}code=${encodeURIComponent(key.trim())}`;
}

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

  submitCommunityRequest(data: any) {
    return this.client.post('/auth/profile/community-requests', data);
  } 

  getUserCommunityRequests() {
    return this.client.get('/auth/profile/community-requests');
  }

  deleteUserCommunityRequest(id: number) {
    return this.client.delete(`/auth/profile/community-requests/${id}`);
  }

  updateUserCommunityRequest(id: number, data: any) {
    return this.client.put(`/auth/profile/community-requests/${id}`, data);
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

  getLatestCompletedMatch() {
    return this.client.get('/matches/latest-completed');
  }

  getTeams() {
    return this.client.get('/matches/teams');
  }

  createMatch(data: any) {
    return this.client.post('/matches', data);
  }

  updateMatch(matchId: string, data: any) {
    return this.client.put(`/matches/${matchId}`, data);
  }

  deleteMatch(matchId: string) {
    return this.client.delete(`/matches/${matchId}`);
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

  getUserPredictionsFromResults(page?: number, limit?: number) {
    return this.client.get('/predictions/results/list', {
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

  adminDeleteUserCommunityRequest(id: number) {
    return this.client.delete(`/admin/community-requests/${id}`);
  }

  adminAddUserCommunityRequest(data: any) {
    return this.client.post('/admin/community-requests', data);
  }

  approveCommunity(data: { userId: string, communityId: string, requestId?: number }) {
    return this.client.post('/admin/approve-community', data);
  }

  createAndApproveCommunity(data: { userId: string; requestId?: number; name: string; fullName?: string; state?: string; city?: string; address?: string; isOnline?: boolean; shortName?: string; description?: string }) {
    return this.client.post('/admin/create-and-approve-community', data);
  }

  rejectCommunity(data: { userId: string, requestId?: number, statusComment?: string }) {
    return this.client.post('/admin/reject-community', data);
  }

  adminCreateCommunity(data: any) {
    return this.client.post('/admin/communities', data);
  }

  adminUpdateCommunity(id: string, data: any) {
    return this.client.put(`/admin/communities/${id}`, data);
  }

  adminDeleteCommunity(id: string) {
    return this.client.delete(`/admin/communities/${id}`);
  }

  finalizeMatch(data: { matchId: string; team1Score: number; team2Score: number }) {
    const functionsUrl = import.meta.env.VITE_FINALIZE_MATCH_URL as string | undefined;
    if (functionsUrl?.trim()) {
      return axios.post(
        withFunctionsKey(functionsUrl.trim()),
        {
          matchId: data.matchId,
          team1Score: data.team1Score,
          team2Score: data.team2Score,
          rebuildLeaderboards: true,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    return this.client.post('/admin/finalize-match', data);
  }

  rebuildLeaderboards(date?: string) {
    const functionsUrl = import.meta.env.VITE_REBUILD_LEADERBOARDS_URL as string | undefined;
    if (!functionsUrl?.trim()) {
      return Promise.reject(new Error('VITE_REBUILD_LEADERBOARDS_URL is not configured'));
    }
    return axios.post(
      withFunctionsKey(functionsUrl.trim()),
      date ? { date } : {},
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  getAllUsers() {
    return this.client.get('/admin/users');
  }

  deleteUser(userId: string) {
    return this.client.delete(`/admin/users/${userId}`);
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
