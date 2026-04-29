export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  communityId1?: string;
  communityId2?: string;
  whatsappNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
}

export interface Match {
  _id?: string;
  matchId: string;
  sequence: number;
  team1: string;
  team2: string;
  team1Score?: number;
  team2Score?: number;
  matchTime: string;
  predictionsEndingTime: string;
  round: number;
  comment?: string;
  matchTag: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface Prediction {
  _id?: string;
  userId: string;
  email: string;
  matchId: string;
  matchTag: string;
  team1Score: number;
  team2Score: number;
  submittedTime: string;
  points: number;
  comment?: string;
}

export interface LeaderboardEntry {
  rank: number;
  totalPoints: number;
  name: string;
  state: string;
  community1?: string;
  community2?: string;
  userId: string;
  email: string;
}

export interface CommunityLeaderboardEntry {
  rank: number;
  totalPoints: number;
  communityName: string;
  communityId: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
