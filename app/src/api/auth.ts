import api from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  vendor?: {
    id: string;
    businessName: string;
    status: string;
    whatsapp: string;
  } | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'VENDOR';
  }): Promise<AuthResponse> {
    return api.post('/auth/register', data);
  },

  login(data: { email: string; password: string }): Promise<AuthResponse> {
    return api.post('/auth/login', data);
  },

  getProfile(): Promise<User> {
    return api.get('/auth/me');
  },

  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return api.post('/auth/refresh', { refreshToken });
  },
};
