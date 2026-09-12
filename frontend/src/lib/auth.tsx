'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'seller' | 'manager' | 'exporter';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  markets: string[];
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  activeMarket: string;
  setActiveMarket: (market: string) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  signup: (data: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: Record<string, User> = {
  'seller@demo.com': {
    id: 'u-seller-01',
    name: 'Priya Sharma',
    email: 'seller@demo.com',
    company: 'GlobalGoods Inc.',
    role: 'seller',
    markets: ['US', 'EU', 'UK'],
  },
  'manager@demo.com': {
    id: 'u-manager-01',
    name: 'James Chen',
    email: 'manager@demo.com',
    company: 'GlobalGoods Inc.',
    role: 'manager',
    markets: ['US', 'EU', 'UK', 'CA', 'JP'],
  },
  'exporter@demo.com': {
    id: 'u-exporter-01',
    name: 'Sarah Mitchell',
    email: 'exporter@demo.com',
    company: 'TradeOps Ltd.',
    role: 'exporter',
    markets: ['US', 'EU', 'CA', 'JP'],
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_USERS['seller@demo.com']);
  const [activeMarket, setActiveMarket] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lexport_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(DEMO_USERS['seller@demo.com']);
        localStorage.setItem('lexport_user', JSON.stringify(DEMO_USERS['seller@demo.com']));
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string, role?: UserRole) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const found = DEMO_USERS[email] || {
      id: `u-${Date.now()}`,
      name: email.split('@')[0],
      email,
      company: 'My Company',
      role: role || 'seller',
      markets: ['US', 'EU'],
    };
    if (role) found.role = role;
    setUser(found);
    localStorage.setItem('lexport_user', JSON.stringify(found));
    setIsLoading(false);
  };

  const signup = async (data: Partial<User> & { password: string }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name || 'New User',
      email: data.email || '',
      company: data.company || '',
      role: data.role || 'seller',
      markets: data.markets || [],
    };
    setUser(newUser);
    localStorage.setItem('lexport_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lexport_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, activeMarket, setActiveMarket, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
