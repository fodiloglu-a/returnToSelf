export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  likedBlogIds?: number[];
  bio?: string;
}
