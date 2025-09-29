'use client';

import type { User, UserRole } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        const data = await res.json();
        setUser(data.user || null);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // Cross-tab sync: refresh on focus and via BroadcastChannel
    const onFocus = () => {
      fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then(d => setUser(d.user || null)).catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auth');
      bc.onmessage = (e) => {
        if (e?.data === 'auth-changed') {
          fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then(d => setUser(d.user || null)).catch(() => {});
        }
      };
    } catch {}
    return () => {
      window.removeEventListener('focus', onFocus);
      try { bc?.close(); } catch {}
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const me = await fetch('/api/me', { cache: 'no-store' });
      const data = await me.json();
      setUser(data.user || null);
      router.push('/dashboard');
      try { new BroadcastChannel('auth').postMessage('auth-changed'); } catch {}
      return !!data.user;
    } catch(e) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);


  const logout = useCallback(async () => {
    try { await fetch('/api/logout', { method: 'POST' }); } catch {}
    setUser(null);
    router.push('/');
    try { new BroadcastChannel('auth').postMessage('auth-changed'); } catch {}
  }, [router]);

  const isAuthenticated = !isLoading && user !== null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, userRole: user?.role || null, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
