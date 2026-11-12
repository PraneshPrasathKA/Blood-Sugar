'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  authApi,
  getStoredToken,
  setStoredToken,
} from '@/services/api';
import { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const res = await authApi.login(input);
      setStoredToken(res.token);
      setUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient]
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const res = await authApi.register(input);
      setStoredToken(res.token);
      setUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await authApi.logout();
      }
    } catch {
      // Ignore network/token errors during logout cleanup
    } finally {
      setStoredToken(null);
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

