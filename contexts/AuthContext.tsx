// contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, CardDetails } from '@/types';

export type { User, UserRole, CardDetails };

/* -------------------------------------------------------------------------- */
/*                               Context Types                                */
/* -------------------------------------------------------------------------- */

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
    role?: UserRole | 'user'
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;

  // Profile
  updateProfile: (data: Partial<User>) => Promise<void>;

  // Local helpers
  toggleFavorite: (restaurantId: string) => void;
  addPoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;

  // Token
  getToken: () => Promise<string | null>;
}

/* -------------------------------------------------------------------------- */
/*                              Context Creation                              */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

const FAVORITES_KEY = 'user_favorites';
const POINTS_KEY = 'user_points';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

/* -------------------------------------------------------------------------- */
/*                              Provider Component                             */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                        Load stored backend auth                           */
  /* ------------------------------------------------------------------------ */

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (token && storedUser) {
        api.setAuthToken(token);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('[Auth] Failed loading stored auth:', err);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                         Supabase Session Listener                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadStoredAuth();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               Fetch Profile                               */
  /* ------------------------------------------------------------------------ */

  const fetchProfile = async (userId: string) => {
    try {
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.warn('[Auth] Profile fetch warning:', dbError);
      }

      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const storedPoints = await AsyncStorage.getItem(POINTS_KEY);

      const authUser = session?.user;

      const profile: User = {
        id: userId,
        name: data?.name || authUser?.user_metadata?.name || 'User',
        email: data?.email || authUser?.email || '',
        phone: data?.phone || '',
        address: data?.address || '',
        role: data?.role || 'customer',
        points: storedPoints ? parseInt(storedPoints, 10) : data?.points || 0,
        favorites: storedFavorites
          ? JSON.parse(storedFavorites)
          : data?.favorites || [],
        photo: data?.photo || authUser?.user_metadata?.avatar_url,
        restaurantId: data?.restaurant_id,
        cardDetails: data?.card_details,
      };

      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (err: any) {
      console.error('[Auth] Profile fetch failed:', err);
      setError(err.message ?? 'Failed to load profile');
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                Auth Actions                               */
  /* ------------------------------------------------------------------------ */

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      // Optional backend login sync
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
        api.setAuthToken(data.token);
      }

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole | 'user' = 'customer'
  ) => {
    try {
      const normalizedRole: UserRole = role === 'user' ? 'customer' : role;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: normalizedRole } },
      });

      if (error) return { error: error.message };

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    api.setAuthToken(null);
    setSession(null);
    setUser(null);
  };

  /* ------------------------------------------------------------------------ */
  /*                             Profile Updates                               */
  /* ------------------------------------------------------------------------ */

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.updateUserProfile(data);
      const updatedUser = { ...user, ...response.data } as User;

      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (err) {
      console.error('[Auth] Update profile failed:', err);
      throw err;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                           Local State Helpers                             */
  /* ------------------------------------------------------------------------ */

  const toggleFavorite = useCallback((restaurantId: string) => {
    setUser((prev) => {
      if (!prev) return prev;

      const favorites = prev.favorites.includes(restaurantId)
        ? prev.favorites.filter((id) => id !== restaurantId)
        : [...prev.favorites, restaurantId];

      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return { ...prev, favorites };
    });
  }, []);

  const addPoints = useCallback((points: number) => {
    setUser((prev) => {
      if (!prev) return prev;

      const newPoints = prev.points + points;
      AsyncStorage.setItem(POINTS_KEY, String(newPoints));
      return { ...prev, points: newPoints };
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                Token Helper                               */
  /* ------------------------------------------------------------------------ */

  const getToken = async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) return token;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  /* ------------------------------------------------------------------------ */
  /*                                  Provider                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile: user,
        isLoading,
        isAuthenticated: !!session?.user || !!user,
        error,
        signIn,
        signUp,
        logout,
        updateProfile,
        toggleFavorite,
        addPoints,
        updateUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
