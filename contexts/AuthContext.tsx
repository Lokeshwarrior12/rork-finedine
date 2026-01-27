// contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UserRole = 'user' | 'restaurant_owner';

export interface Profile {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole | null;
  points?: number;
  restaurant_id?: string;
  photo?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
    role?: UserRole
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  /** Used by lib/api.ts */
  getToken: () => Promise<string | null>;
}

/* -------------------------------------------------------------------------- */
/*                                Context Init                                */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              Provider Component                             */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
      }
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
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

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          name,
          email,
          phone,
          address,
          role,
          points,
          restaurant_id,
          photo
        `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data as Profile);
    } catch (err: any) {
      console.error('[Auth] Profile fetch failed:', err);
      setError(err.message ?? 'Failed to load profile');
      setProfile(null);
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
    setProfile(null);
  };

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
        user: session?.user ?? null,
        profile,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
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
