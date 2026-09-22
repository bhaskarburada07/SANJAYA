import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { INITIAL_PROFILE } from '../services/mockData';
import { realtimeBus } from '../lib/supabase';

const USERS_DB_KEY = 'sanjaya_users_db';
const AUTH_USER_KEY = 'sanjaya_auth_user';

export interface StoredUserAccount extends UserProfile {
  password?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => Promise<UserProfile>;
  signIn: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, phone?: string) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<void>;
  authenticateWithEmail: (
    email: string, 
    password?: string
  ) => Promise<{ user: UserProfile; needsName: boolean; isExisting: boolean; profile: UserProfile }>;
  checkUserExists: (email: string) => Promise<{ exists: boolean; profile?: UserProfile }>;
  completeProfileSetup: (email: string, name: string, homeName?: string, password?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to access and seed the local user database
function getUsersDB(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse users DB:', e);
  }

  // Pre-seed default demo account
  const initialDb: Record<string, StoredUserAccount> = {
    [INITIAL_PROFILE.email.toLowerCase()]: {
      ...INITIAL_PROFILE,
      last_login_at: new Date().toISOString(),
    },
    'bhaskar@gmail.com': {
      ...INITIAL_PROFILE,
      email: 'bhaskar@gmail.com',
      last_login_at: new Date().toISOString(),
    }
  };

  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(initialDb));
  } catch {
    // ignore
  }

  return initialDb;
}

function saveUserToDB(user: StoredUserAccount) {
  try {
    const db = getUsersDB();
    db[user.email.toLowerCase()] = {
      ...db[user.email.toLowerCase()],
      ...user,
    };
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save user to DB:', e);
  }
}

// Derive a clean display name from an email address (e.g. bhaskar@gmail.com -> Bhaskar)
function deriveNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'Homeowner';
  const parts = localPart.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return 'Homeowner';
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous session restoration on page load / refresh
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.id)) {
          return {
            ...parsed,
            last_login_at: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Synchronize across tabs if changed
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_USER_KEY) {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            // ignore
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /**
   * PRIMARY LOGIN FLOW:
   * Valid email -> immediately create local SANJAYA session -> navigate to Dashboard.
   * Works for ANY valid email format.
   */
  const login = useCallback(async (email: string, explicitName?: string): Promise<UserProfile> => {
    const normalized = email.trim().toLowerCase();
    const db = getUsersDB();
    const existing = db[normalized];

    const now = new Date().toISOString();
    let sessionUser: UserProfile;

    if (existing) {
      sessionUser = {
        ...existing,
        email: normalized,
        name: explicitName?.trim() || existing.name || deriveNameFromEmail(normalized),
        full_name: explicitName?.trim() || existing.full_name || existing.name || deriveNameFromEmail(normalized),
        last_login_at: now,
      };
    } else {
      const displayName = explicitName?.trim() || deriveNameFromEmail(normalized);
      sessionUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: displayName,
        full_name: displayName,
        email: normalized,
        phone: '+91 98765 43210',
        home_name: `${displayName}'s Residence`,
        home_address: INITIAL_PROFILE.home_address,
        avatar_url: INITIAL_PROFILE.avatar_url,
        created_at: now,
        last_login_at: now,
      };
    }

    // 1. Store in local users database
    saveUserToDB(sessionUser);

    // 2. Persist active session in localStorage (survives refresh)
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
    }

    // 3. Immediately update active user state
    setUser(sessionUser);
    realtimeBus.publish('profile:update', sessionUser);

    return sessionUser;
  }, []);

  const signIn = async (email: string) => {
    await login(email);
  };

  const signup = async (email: string, name: string) => {
    await login(email, name);
  };

  const signUp = async (email: string, _password?: string, fullName?: string) => {
    await login(email, fullName);
  };

  const authenticateWithEmail = async (email: string) => {
    const profile = await login(email);
    return {
      user: profile,
      needsName: false,
      isExisting: true,
      profile,
    };
  };

  const checkUserExists = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    const db = getUsersDB();
    const found = db[normalized];
    return {
      exists: !!found,
      profile: found,
    };
  };

  const completeProfileSetup = async (email: string, name: string, homeName?: string) => {
    const profile = await login(email, name);
    if (homeName?.trim()) {
      return await updateProfile({ home_name: homeName.trim() });
    }
    return profile;
  };

  /**
   * LOGOUT FLOW:
   * Clear local SANJAYA session -> return to login page.
   */
  const logout = useCallback(async () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.error('Failed to clear session from localStorage:', e);
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, [logout]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!user) throw new Error('No active user session');

    const resolvedFullName = updates.full_name !== undefined 
      ? updates.full_name.trim() 
      : updates.name !== undefined 
        ? updates.name.trim() 
        : (user.full_name || user.name);
    
    const resolvedName = updates.name !== undefined 
      ? updates.name.trim() 
      : resolvedFullName;

    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      name: resolvedName,
      full_name: resolvedFullName,
    };

    setUser(updatedUser);
    saveUserToDB(updatedUser);

    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e);
    }

    realtimeBus.publish('profile:update', updatedUser);
    return updatedUser;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signIn,
        signup,
        signUp,
        authenticateWithEmail,
        checkUserExists,
        completeProfileSetup,
        logout,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
