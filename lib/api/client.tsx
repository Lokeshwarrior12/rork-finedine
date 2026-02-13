import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'customer' | 'restaurant_owner' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event);
      if (session?.user) {
        const userData = await loadUserData(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await auth.getSession();
      if (session) {
        const userData = await loadUserData(session.user.id);
        setUser(userData);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string): Promise<User> => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        return JSON.parse(stored);
      }

      // Fetch from your backend
      const response = await fetch(`${API_URL}/api/v1/profile`, {
        headers: {
          'Authorization': `Bearer ${(await auth.getSession())?.access_token}`,
        },
      });

      const data = await response.json();
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Load user data error:', error);
      return { id: userId, email: '' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await auth.signIn(email, password);
      if (data.user) {
        const userData = await loadUserData(data.user.id);
        setUser(userData);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const data = await auth.signUp(email, password, { name, role });
      if (data.user) {
        const userData = { id: data.user.id, email, name, role: role as any };
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.multiRemove(['userData']);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const session = await auth.getSession();
      const response = await fetch(`${API_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const updatedData = await response.json();
      const updatedUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser as User);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export async function apiFetch(path: string, options?: RequestInit) {
  const baseUrl = API_URL || '';
  const url = `${baseUrl}${path}`;
  
  try {
    const session = await auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error: ${path}`, error);
    throw error;
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
