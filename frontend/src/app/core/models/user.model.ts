export type UserRole = 'user' | 'critic' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean; // ⚡ AGREGADO
  avatar?: string;
  bio?: string;
  country?: string;
  favoriteGenre?: string;
  website?: string;
  likedMovies?: any[];
  dislikedMovies?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}