import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import { User, UserRole } from '@/types';
import { trpc } from '@/lib/trpc';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

type LoginInput = {
  email: string;
  password: string;
  role: UserRole;
};

type SignupInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  role: UserRole;
  cuisinePreferences?: string[];
  restaurantId?: string;
  verificationCode?: string;
  skipVerification?: boolean;
};

interface SupabaseSession {
  access_token: string;
  user: { id: string; email?: string };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then((result) => {
      if (result.data?.session) {
        setSession(result.data.session as unknown as SupabaseSession);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession as unknown as SupabaseSession | null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const authQuery = useQuery({
    queryKey: ['auth', 'stored'],
    queryFn: async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

        if (storedToken) setToken(storedToken);

        return storedUser ? JSON.parse(storedUser) : null;
      } catch (err) {
        console.error('Error loading auth:', err);
        return null;
      }
    }
  });

  const verifyTokenQuery = trpc.auth.verifyToken.useQuery(undefined, {
    enabled: !!token,
    retry: (failureCount, error) => {
      const errorMessage = error?.message || '';
      const isAbortError = errorMessage.includes('cancelled') || errorMessage.includes('aborted');
      if (isAbortError) return false;
      return failureCount < 2;
    },
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (verifyTokenQuery.data?.valid && verifyTokenQuery.data?.user) {
      setUser(verifyTokenQuery.data.user);
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(verifyTokenQuery.data.user)
      );
    }
  }, [verifyTokenQuery.data]);

  useEffect(() => {
    if (verifyTokenQuery.error) {
      const errorMessage = verifyTokenQuery.error.message || '';
      const isNetworkError = errorMessage.includes('timeout') || 
                            errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('Network') ||
                            errorMessage.includes('offline') ||
                            errorMessage.includes('cancelled') ||
                            errorMessage.includes('aborted');
      
      if (!isNetworkError) {
        console.log('Token verification failed, clearing auth');
        AsyncStorage.removeItem(STORAGE_KEY);
        AsyncStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
        queryClient.clear();
      } else {
        console.log('Network/abort error during token verification, keeping local auth');
      }
    }
  }, [verifyTokenQuery.error, queryClient]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      setUser(data.user);
      setToken(data.token);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data.user)
      );
      await AsyncStorage.setItem(TOKEN_KEY, data.token);

      if (isSupabaseConfigured && 'rawPassword' in data) {
        await supabase.auth.signInWithPassword({
          email: data.user.email,
          password: (data as { rawPassword: string }).rawPassword
        });
      }

      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async (data) => {
      setUser(data.user);
      setToken(data.token);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data.user)
      );
      await AsyncStorage.setItem(TOKEN_KEY, data.token);

      if (isSupabaseConfigured && 'rawPassword' in data) {
        await supabase.auth.signUp({
          email: data.user.email,
          password: (data as { rawPassword: string }).rawPassword,
          options: {
            data: {
              full_name: data.user.name,
              phone: data.user.phone,
              address: data.user.address,
              role: data.user.role
            }
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  });

  const toggleFavoriteMutation = trpc.auth.toggleFavorite.useMutation({
    onSuccess: async (data) => {
      if (data) {
        setUser(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }
  });

  const addPointsMutation = trpc.auth.addPoints.useMutation({
    onSuccess: async (data) => {
      if (data) {
        setUser(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }
  });

  const login = useCallback(
    (input: LoginInput) => loginMutation.mutateAsync(input),
    [loginMutation]
  );

  const signup = useCallback(
    (input: SignupInput) => signupMutation.mutateAsync(input),
    [signupMutation]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setToken(null);
    setSession(null);

    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      updateProfileMutation.mutate(updates);
    },
    [updateProfileMutation]
  );

  const toggleFavorite = useCallback(
    (restaurantId: string) => {
      if (!user) return;

      const updatedFavorites = user.favorites.includes(restaurantId)
        ? user.favorites.filter(id => id !== restaurantId)
        : [...user.favorites, restaurantId];

      setUser({ ...user, favorites: updatedFavorites });
      toggleFavoriteMutation.mutate({ restaurantId });
    },
    [user, toggleFavoriteMutation]
  );

  const addPoints = useCallback(
    (points: number) => {
      if (!user) return;
      setUser({ ...user, points: user.points + points });
      addPointsMutation.mutate({ points });
    },
    [user, addPointsMutation]
  );

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setUser(authQuery.data);
      setIsLoading(false);
    } else if (!authQuery.isLoading) {
      setIsLoading(false);
    }
  }, [authQuery.data, authQuery.isLoading]);

  return {
    user,
    token,
    session,
    isLoading,
    isAuthenticated: !!user && !!token,

    login,
    signup,
    logout,

    updateUser,
    toggleFavorite,
    addPoints,

    loginPending: loginMutation.isPending,
    signupPending: signupMutation.isPending,

    loginError: loginMutation.error?.message,
    signupError: signupMutation.error?.message
  };
});

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
