import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const THEME_KEY = 'app_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  accentLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  overlay: string;
  shadow: string;
  shimmer: string;
  rating: string;
  cashback: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light-content' | 'dark-content';
  card: string;
  cardBorder: string;
  inputBackground: string;
  placeholder: string;
}

const lightColors: ThemeColors = {
  primary: '#E85D04',
  primaryDark: '#D45500',
  primaryLight: '#FFF4EC',
  secondary: '#EF4444',
  accent: '#FFB703',
  accentLight: '#FFF8E6',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  background: '#FAFAFA',
  backgroundSecondary: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#F5F5F5',
  text: '#1A1A2E',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  overlay: 'rgba(26, 26, 46, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shimmer: '#E5E7EB',
  rating: '#FFB703',
  cashback: '#E85D04',
  tabBar: '#FFFFFF',
  tabBarBorder: '#F3F4F6',
  statusBar: 'dark-content',
  card: '#FFFFFF',
  cardBorder: '#F3F4F6',
  inputBackground: '#F8FAFC',
  placeholder: '#94A3B8',
};

const darkColors: ThemeColors = {
  primary: '#FF8A4C',
  primaryDark: '#E85D04',
  primaryLight: '#3D2010',
  secondary: '#F87171',
  accent: '#FFD166',
  accentLight: '#3D3520',
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  error: '#F87171',
  errorLight: '#450A0A',
  background: '#0F0F1A',
  backgroundSecondary: '#1A1A2E',
  surface: '#1A1A2E',
  surfaceElevated: '#252540',
  surfacePressed: '#252540',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0F0F1A',
  border: '#2D2D44',
  borderLight: '#1A1A2E',
  divider: '#2D2D44',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shimmer: '#2D2D44',
  rating: '#FFD166',
  cashback: '#FF8A4C',
  tabBar: '#1A1A2E',
  tabBarBorder: '#2D2D44',
  statusBar: 'light-content',
  card: '#1A1A2E',
  cardBorder: '#2D2D44',
  inputBackground: '#252540',
  placeholder: '#64748B',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const queryClient = useQueryClient();
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const themeQuery = useQuery({
    queryKey: ['theme'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      return (stored as ThemeMode) || 'system';
    },
  });

  const themeMutation = useMutation({
    mutationFn: async (mode: ThemeMode) => {
      await AsyncStorage.setItem(THEME_KEY, mode);
      return mode;
    },
    onSuccess: (mode) => {
      setThemeMode(mode);
      queryClient.invalidateQueries({ queryKey: ['theme'] });
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    themeMutation.mutate(newMode);
  };

  const setTheme = (mode: ThemeMode) => {
    themeMutation.mutate(mode);
  };

  return {
    themeMode,
    isDark,
    colors,
    toggleTheme,
    setTheme,
    isLoading: themeQuery.isLoading,
  };
});
