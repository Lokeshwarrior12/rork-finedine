import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

const STORAGE_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) setToken(storedToken);
      return stored ? JSON.parse(stored) : null;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: UserRole }) => {
      console.log('Logging in:', email, role);
      
      const defaultCustomer: User = {
        id: 'user1',
        name: 'John Doe',
        email: email,
        phone: '+1 234 567 8900',
        address: '123 Main St, New York, NY 10001',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        role: 'customer',
        points: 1250,
        favorites: ['1', '3'],
        cardDetails: {
          lastFour: '4242',
          expiryDate: '12/27',
          cardType: 'Visa',
        },
      };

      const defaultRestaurantOwner: User = {
        id: 'owner1',
        name: 'Marco Rossi',
        email: email,
        phone: '+1 234 567 8900',
        address: '123 Main Street, New York',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        role: 'restaurant_owner',
        points: 0,
        favorites: [],
        restaurantId: '1',
      };

      const mockUser = role === 'customer' ? defaultCustomer : defaultRestaurantOwner;
      const mockToken = mockUser.id;
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      await AsyncStorage.setItem(TOKEN_KEY, mockToken);
      
      return { user: mockUser, token: mockToken };
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { role: UserRole; password?: string }) => {
      console.log('Signing up:', userData);
      
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        role: userData.role,
        points: 0,
        favorites: [],
        restaurantId: userData.role === 'restaurant_owner' ? `rest_${Date.now()}` : undefined,
      };
      
      const newToken = newUser.id;
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      
      return { user: newUser, token: newToken };
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
    },
    onSuccess: () => {
      setUser(null);
      setToken(null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('No user logged in');
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const toggleFavorite = (restaurantId: string) => {
    if (!user) return;
    const newFavorites = user.favorites.includes(restaurantId)
      ? user.favorites.filter(id => id !== restaurantId)
      : [...user.favorites, restaurantId];
    updateUserMutation.mutate({ favorites: newFavorites });
  };

  const addPoints = (points: number) => {
    if (!user) return;
    updateUserMutation.mutate({ points: user.points + points });
  };

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
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateUser: updateUserMutation.mutate,
    toggleFavorite,
    addPoints,
    loginPending: loginMutation.isPending,
    signupPending: signupMutation.isPending,
  };
});
