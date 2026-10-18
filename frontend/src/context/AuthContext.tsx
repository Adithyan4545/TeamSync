'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';
import { User } from '@/types';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to refresh token to get user
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post('/auth/refresh-token');
        if (res.data.success) {
          const newAccess = res.data.data.accessToken;
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          const decoded = jwtDecode<DecodedToken>(newAccess);
          
          try {
            const meRes = await axios.get('/users/me');
            const userData = meRes.data.data;
            setUser({ id: decoded.id, role: decoded.role, name: userData.name, email: userData.email } as User);
          } catch {
            setUser({ id: decoded.id, role: decoded.role } as User);
          }
        }
      } catch {
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const res = await axios.post('/auth/login', { email, password, rememberMe });
      if (res.data.success) {
        const newAccess = res.data.data.accessToken;
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        const decoded = jwtDecode<DecodedToken>(newAccess);
        
        try {
          const meRes = await axios.get('/users/me');
          const userData = meRes.data.data;
          setUser({ id: decoded.id, role: decoded.role, name: userData.name, email: userData.email } as User);
        } catch {
          setUser({ id: decoded.id, role: decoded.role } as User);
        }
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await axios.post('/auth/register', { name, email, password });
    if (res.data.success) {
      setUser(null);
    } else {
      throw new Error(res.data.message || 'Registration failed');
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await axios.post('/auth/google', { credential });
    if (res.data.success) {
      const newAccess = res.data.data.accessToken;
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
      const decoded = jwtDecode<DecodedToken>(newAccess);
      
      try {
        const meRes = await axios.get('/users/me');
        const userData = meRes.data.data;
        setUser({ id: decoded.id, role: decoded.role, name: userData.name, email: userData.email } as User);
      } catch {
        setUser({ id: decoded.id, role: decoded.role } as User);
      }
    } else {
      throw new Error(res.data.message || 'Google login failed');
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
