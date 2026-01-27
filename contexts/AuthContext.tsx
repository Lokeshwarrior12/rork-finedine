// contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UserRole = 'user' | 'restaurant_owner';

export interface CardDetails {
  lastFour: string;
  expiryDate: string;
  cardType: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  points: number;
  favorites: string[];
  photo?: string;
  restaurantId?: string;
  cardDetails?: CardDetails;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
    role?: UserRole
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;

  toggleFavorite: (restaurantId: string) => void;
  addPoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;

  getToken: () => Promise<string | null>;
}

/* -------------------------------------------------------------------------- */
/*                                Context Init                                */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              Provider Component                             */
/* -------------------------------------------------------------------------- */

const FAVORITES_KEY = 'user_favorites';
const POINTS_KEY = 'user_points';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                           Session + Listener                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                              Fetch Profile                                */
  /* ------------------------------------------------------------------------ */

  const fetchProfile = async (userId: string) => {
    try {
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const storedPoints = await AsyncStorage.getItem(POINTS_KEY);

      if (dbError && dbError.code !== 'PGRST116') {
        console.warn('[Auth] Profile fetch warning:', dbError);
      }

      const authUser = session?.user;
      const profile: User = {
        id: userId,
        name: data?.name || authUser?.user_metadata?.name || 'User',
        email: data?.email || authUser?.email || '',
        phone: data?.phone || '',
        address: data?.address || '',
        role: data?.role || 'user',
        points: storedPoints ? parseInt(storedPoints, 10) : (data?.points || 0),
        favorites: storedFavorites ? JSON.parse(storedFavorites) : (data?.favorites || []),
        photo: data?.photo || authUser?.user_metadata?.avatar_url,
        restaurantId: data?.restaurant_id,
        cardDetails: data?.card_details,
      };

      setUser(profile);
    } catch (err: any) {
      console.error('[Auth] Profile fetch failed:', err);
      setError(err.message ?? 'Failed to load profile');
      
      const authUser = session?.user;
      if (authUser) {
        setUser({
          id: userId,
          name: authUser.user_metadata?.name || 'User',
          email: authUser.email || '',
          role: 'user',
          points: 0,
          favorites: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                 Actions                                   */
  /* ------------------------------------------------------------------------ */

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole = 'user'
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const logout = signOut;

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
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                            Token Helper (API)                              */
  /* ------------------------------------------------------------------------ */

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  /* ------------------------------------------------------------------------ */
  /*                                  Provider                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated: !!session?.user,
        error,
        signIn,
        signUp,
        signOut,
        logout,
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
/*                                   Hook                                     */
/* -------------------------------------------------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
