import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authQuery = useQuery({
    queryKey: ['auth', 'stored'],
    queryFn: async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        
        if (storedToken) {
          setToken(storedToken);
        }
        
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('Error loading auth state:', error);
        return null;
      }
    },
  });

  const verifyTokenQuery = trpc.auth.verifyToken.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (verifyTokenQuery.data?.valid && verifyTokenQuery.data?.user) {
      setUser(verifyTokenQuery.data.user);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(verifyTokenQuery.data.user));
    }
  }, [verifyTokenQuery.data]);

  useEffect(() => {
    if (verifyTokenQuery.error) {
      AsyncStorage.removeItem(STORAGE_KEY);
      AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      queryClient.clear();
    }
  }, [verifyTokenQuery.error, queryClient]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      console.log('Login successful:', data.user.id);
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Login error:', error.message);
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async (data) => {
      console.log('Signup successful:', data.user.id);
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Signup error:', error.message);
    },
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const toggleFavoriteMutation = trpc.auth.toggleFavorite.useMutation({
    onSuccess: async (data) => {
      if (data) {
        setUser(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    },
  });

  const addPointsMutation = trpc.auth.addPoints.useMutation({
    onSuccess: async (data) => {
      if (data) {
        setUser(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    },
  });

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
      queryClient.clear();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [queryClient]);

  const login = useCallback(async ({ 
    email, 
    password, 
    role 
  }: { 
    email: string; 
    password: string; 
    role: UserRole 
  }) => {
    return loginMutation.mutateAsync({ email, password, role });
  }, [loginMutation]);

  const signup = useCallback(async (userData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
    role: UserRole;
    cuisinePreferences?: string[];
    restaurantId?: string;
  }) => {
    return signupMutation.mutateAsync(userData);
  }, [signupMutation]);

  const updateUser = useCallback((updates: Partial<User>) => {
    updateProfileMutation.mutate(updates);
  }, [updateProfileMutation]);

  const toggleFavorite = useCallback((restaurantId: string) => {
    if (!user) return;
    
    const newFavorites = user.favorites.includes(restaurantId)
      ? user.favorites.filter(id => id !== restaurantId)
      : [...user.favorites, restaurantId];
    
    setUser({ ...user, favorites: newFavorites });
    toggleFavoriteMutation.mutate({ restaurantId });
  }, [user, toggleFavoriteMutation]);

  const addPoints = useCallback((points: number) => {
    if (!user) return;
    setUser({ ...user, points: user.points + points });
    addPointsMutation.mutate({ points });
  }, [user, addPointsMutation]);

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
    signupError: signupMutation.error?.message,
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
