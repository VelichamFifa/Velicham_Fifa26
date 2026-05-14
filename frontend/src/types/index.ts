export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  city: string;
  state: string;
  country: string;
  communityId1?: string;
  communityId2?: string;
  phoneNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean; 
  createdAt?: string;
  requestedCommunity?: {
    name: string;
    shortName: string;
    description: string;
    isOnline: boolean;
    city: string;
    state: string;
    existingCommunityId?: string;
  };
}

export interface Community {
  _id: string;
  communityId: string;
  name: string;
  fullName?: string;
  state: string;
  city: string;
}

export interface TeamInfo {
  teamName: string;
  countryLogo?: string | null;
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
  round: string;
  group?: string;
  comment?: string;
  matchTag: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  team1Info?: TeamInfo | null;
  team2Info?: TeamInfo | null;
}

export interface Prediction {
  _id?: string;
  userId: string;
  matchId: string | Match;
  matchTag: string;
  team1Score: number;
  team2Score: number;
  submittedTime: string;
  points: number;
  comment?: string;
  historicRank?: {
    finalRank: number;
    dailyRank: number;
  } | null;
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
