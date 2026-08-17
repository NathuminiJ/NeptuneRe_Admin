import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ADMIN_PROFILE } from '../data/mock';
import type { AdminProfile } from '../types';

/**
 * UI-only session context.
 * No real authentication is performed — login() simply starts a session
 * with the admin profile. Swap this for the real Neptune auth endpoint later.
 */

interface AuthContextValue {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  login: (loginId: string, _password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const login = useCallback((loginId: string, _password: string) => {
    setAdmin({ ...ADMIN_PROFILE, loginId: loginId || ADMIN_PROFILE.loginId });
  }, []);

  const logout = useCallback(() => setAdmin(null), []);

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, login, logout }),
    [admin, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}