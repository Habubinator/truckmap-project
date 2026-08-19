import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { ENDPOINTS, apiRequest, setAccessToken } from './api';

export type AdminUser = {
  id?: number;
  name?: string;
  email?: string;
  username?: string;
  roleId?: number;
};

type AuthState = {
  user: AdminUser | null;
  login: (login: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthState>(
    () => ({
      user,
      async login(login, password) {
        const res = await fetch(ENDPOINTS.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ login, password }),
        });
        const body = (await res.json()) as {
          success: boolean;
          message?: string;
          data?: { accessToken: string; user: AdminUser };
        };
        if (!res.ok || !body.success || !body.data) {
          return { ok: false, message: body.message ?? 'Login failed' };
        }
        setAccessToken(body.data.accessToken);
        localStorage.setItem('userInfo', JSON.stringify(body.data.user));
        setUser(body.data.user);
        return { ok: true };
      },
      async logout() {
        try {
          await apiRequest(ENDPOINTS.logout, 'POST');
        } catch {
          /* ignore */
        }
        setAccessToken(null);
        localStorage.removeItem('userInfo');
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
