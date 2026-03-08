import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getToken, setToken, removeToken } from "../utils/api";

export interface UserType {
  id: string;
  phone: string;
  name?: string;
  photo?: string;
  role?: string;
  rating: number;
  total_ratings: number;
  push_token?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (token: string, user: UserType) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserType>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch {
      await removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userData: UserType) => {
    await setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await api.getMe();
    setUser(userData);
  };

  const updateUser = (updates: Partial<UserType>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
