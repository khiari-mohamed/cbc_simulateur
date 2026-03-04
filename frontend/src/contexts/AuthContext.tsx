import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import api from '../lib/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp?: boolean; userId?: string }>;
  verifyOtp: (userId: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ userId: string }>;
  resetPassword: (userId: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Expose setUser for Google callback
  (window as any).__setAuthUser = setUser;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔍 AUTH CONTEXT - Login called with:', email);
      const { data } = await api.post('/auth/login', { email, password });
      console.log('🔍 AUTH CONTEXT - Response:', data);
      
      if (data.requiresOtp) {
        return { requiresOtp: true, userId: data.userId };
      }

      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      setUser(data.user);
      return {};
    } catch (error) {
      console.error('🔍 AUTH CONTEXT - Login error:', error);
      throw error;
    }
  };

  const verifyOtp = async (userId: string, otp: string) => {
    const { data } = await api.post('/auth/verify-otp', { userId, otp });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const forgotPassword = async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return { userId: data.userId };
  };

  const resetPassword = async (userId: string, otp: string, newPassword: string) => {
    await api.post('/auth/reset-password', { userId, otp, newPassword });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, forgotPassword, resetPassword, logout, isAuthenticated: !!user, setUser } as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
