import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, type User } from '@/api/auth';
import api from '@/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: 'CUSTOMER' | 'VENDOR' }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al montar (si hay token guardado)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getProfile()
        .then(setUser)
        .catch(() => {
          api.clearTokens();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Escuchar evento de logout forzado (token expirado)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      api.clearTokens();
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    api.setToken(result.accessToken);
    api.setRefreshToken(result.refreshToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'VENDOR';
  }) => {
    const result = await authApi.register(data);
    api.setToken(result.accessToken);
    api.setRefreshToken(result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    api.clearTokens();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      // silently fail
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isVendor: user?.role === 'VENDOR',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
