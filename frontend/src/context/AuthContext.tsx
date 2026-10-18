import React, { createContext, useContext, useState } from 'react';
import { TabType } from '../components/Sidebar';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'Admin' | 'Receptionist';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  title: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasAccessToTab: (tab: TabType) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tabs allowed for Receptionist role
export const RECEPTIONIST_ALLOWED_TABS: TabType[] = [
  'dashboard',
  'appointments',
  'clients',
  'services',
  'dispatches',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('aurea_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Admin';

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      // Validate credentials against PostgreSQL backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        const role = data.role.toUpperCase() as UserRole;
        const authUser: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name || (role === 'ADMIN' ? 'د. خالد عبد الرحمن' : 'سارة أحمد'),
          role: role,
          title: data.title || (role === 'ADMIN' ? 'المدير العام' : 'موظف الاستقبال'),
        };
        setUser(authUser);
        localStorage.setItem('aurea_auth_user', JSON.stringify(authUser));
        return { success: true };
      } else {
        const errorData = await res.json().catch(() => null);
        return {
          success: false,
          error: errorData?.error || 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التحقق من البيانات المدخلة.',
        };
      }
    } catch (err) {
      console.warn('API error during login, falling back to local verification:', err);
      // Emergency local fallback in case network issues occur
      if (cleanUsername.toLowerCase() === 'admin' && cleanPassword === '123') {
        const adminUser: AuthUser = {
          id: 'usr-admin-01',
          username: 'admin',
          name: 'د. خالد عبد الرحمن',
          role: 'ADMIN',
          title: 'المدير العام',
        };
        setUser(adminUser);
        localStorage.setItem('aurea_auth_user', JSON.stringify(adminUser));
        return { success: true };
      }
      if (cleanUsername.toLowerCase() === 'reception' && cleanPassword === '123') {
        const receptionUser: AuthUser = {
          id: 'usr-reception-01',
          username: 'reception',
          name: 'سارة أحمد',
          role: 'RECEPTIONIST',
          title: 'موظف الاستقبال',
        };
        setUser(receptionUser);
        localStorage.setItem('aurea_auth_user', JSON.stringify(receptionUser));
        return { success: true };
      }

      return {
        success: false,
        error: 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurea_auth_user');
  };

  const hasAccessToTab = (tab: TabType): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return RECEPTIONIST_ALLOWED_TABS.includes(tab);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        login,
        logout,
        hasAccessToTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
