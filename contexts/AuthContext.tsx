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
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, CardDetails } from '@/types';

/* -------------------------------------------------------------------------- */
/*                               Context Types                                */
/* -------------------------------------------------------------------------- */

interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  /** Auth */
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signInPending: boolean;

  signup: (credentials: SignupCredentials) => Promise<void>;
  signupPending: boolean;

  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  /** Profile helpers */
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleFavorite: (restaurantId: string) => void;
  addPoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;

  /** Token helper */
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
const USER_KEY = 'user_profile';

/* -------------------------------------------------------------------------- */
/*                              Provider Component                             */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [signInPending, setSignInPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*                            Load Stored Profile                            */
  /* ------------------------------------------------------------------------ */

  const loadStoredProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch (err) {
      console.warn('[Auth] Failed to load stored profile:', err);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                         Supabase Session Listener                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadStoredProfile();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        await AsyncStorage.removeItem(USER_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               Fetch Profile                               */
  /* ------------------------------------------------------------------------ */

  const fetchProfile = async (authUser: SupabaseUser) => {
    try {
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.warn('[Auth] Profile fetch warning:', dbError);
      }

      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const storedPoints = await AsyncStorage.getItem(POINTS_KEY);

      const profile: User = {
        id: authUser.id,
        name: data?.name || authUser.user_metadata?.name || 'User',
        email: data?.email || authUser.email || '',
        phone: data?.phone || '',
        address: data?.address || '',
        role: data?.role || 'customer',
        points: storedPoints ? parseInt(storedPoints, 10) : data?.points || 0,
        favorites: storedFavorites
          ? JSON.parse(storedFavorites)
          : data?.favorites || [],
        photo: data?.photo || authUser.user_metadata?.avatar_url,
        restaurantId: data?.restaurant_id,
        cardDetails: data?.card_details as CardDetails | undefined,
      };

      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (err: any) {
      console.error('[Auth] Profile fetch failed:', err);
      setError(err.message ?? 'Failed to load profile');
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                AUTH ACTIONS                               */
  /* ------------------------------------------------------------------------ */

  const signIn = async ({ email, password }: LoginCredentials) => {
    setSignInPending(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      if (data.user) await fetchProfile(data.user);
    } finally {
      setSignInPending(false);
    }
  };

  const signup = async ({
    email,
    password,
    name,
    phone,
    role = 'customer',
  }: SignupCredentials) => {
    setSignupPending(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone, role } },
      });

      if (error) throw error;

      setSession(data.session);
      if (data.user) await fetchProfile(data.user);
    } finally {
      setSignupPending(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setUser(null);

    await AsyncStorage.multiRemove([USER_KEY, FAVORITES_KEY, POINTS_KEY]);
  };

  const refreshSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) throw error;

    setSession(session);
    if (session?.user) await fetchProfile(session.user);
  };

  /* ------------------------------------------------------------------------ */
  /*                             PROFILE HELPERS                               */
  /* ------------------------------------------------------------------------ */

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;

    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

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
  /*                                TOKEN HELPER                               */
  /* ------------------------------------------------------------------------ */

  const getToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  /* ------------------------------------------------------------------------ */
  /*                                  PROVIDER                                 */
  /* ------------------------------------------------------------------------ */

  const value: AuthContextValue = {
    user,
    session,
    loading,
    error,
    signIn,
    signInPending,
    signup,
    signupPending,
    signOut,
    refreshSession,
    updateProfile,
    toggleFavorite,
    addPoints,
    updateUser,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                                    HOOK                                    */
/* -------------------------------------------------------------------------- */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
