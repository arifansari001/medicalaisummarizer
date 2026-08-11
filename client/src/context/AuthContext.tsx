import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { User, LoginData, RegisterData, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('medsummary_token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token by fetching user
      api.get<{ user: User }>('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('medsummary_token');
          localStorage.removeItem('medsummary_user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginData) => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('medsummary_token', res.data.token);
    localStorage.setItem('medsummary_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('medsummary_token', res.data.token);
    localStorage.setItem('medsummary_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('medsummary_token');
    localStorage.removeItem('medsummary_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('medsummary_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!user, isLoading,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
