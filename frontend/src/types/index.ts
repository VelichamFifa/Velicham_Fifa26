export interface Community {
  Community_ID: string;
  Name: string;
  State: string;
  City: string;
  President_Name: string;
  Creation_Time: string;
}

export interface User {
  User_ID: number;
  Email: string;
  First_Name: string;
  Last_Name: string;
  Status: 'Active' | 'Inactive';
  Creation_Time?: string;
  WhatsApp_Number?: string;
  City?: string;
  State?: string;
  Country?: string;
  Community_ID?: string;
  role?: 'user' | 'admin';
  profileImage?: string;
}
 
export interface Match {
  ID: number;
  LDF: string;
  UDF: string;
  NDA: string;
  IsFinalized: boolean;
  FinalizedAt?: string;
  Official_UDF?: number;
  Official_LDF?: number;
  Official_NDA?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  Email: string;
  MatchID: number;
  UDF_Score: number;
  LDF_Score: number;
  NDA_Score: number;
  Total_Points: number;
  Last_Submitted_Time: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  email: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  lastSubmittedTime?: string;
  communityId?: string;
  denseRank?: number;
}

export interface CommunityLeaderboardEntry {
  communityId: string | number;
  Name: string;
  communityName?: string;
  Average_Accuracy: number;
  Member_Count: number;
}

export interface LeaderboardData {
  individual: LeaderboardEntry[];
  community: CommunityLeaderboardEntry[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  city?: string;
  state?: string;
  country?: string;
  communityId?: string;
  phoneNumber?: string;
  googleId?: string;
  profileImage?: string;
}

export interface UserProfile {
  User_ID: number;
  Email: string;
  First_Name: string;
  Last_Name: string;
  City?: string;
  State?: string;
  Country?: string;
  Community_ID?: string;
  WhatsApp_Number?: string;
  role?: string;
  Status?: string;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface PredictionRequest {
  Email: string;
  MatchID: number;
  UDF_Score: number;
  LDF_Score: number;
  NDA_Score: number;
}

export interface FinalizeRequest {
  matchId: number;
  official_UDF: number;
  official_LDF: number;
  official_NDA: number;
}

export interface GoogleLoginRequest {
  credential: string;
}
export interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
