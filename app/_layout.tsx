// app/_layout.tsx

import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/* -----------------------------------------------------
   SPLASH SCREEN
----------------------------------------------------- */

SplashScreen.preventAutoHideAsync();

/* -----------------------------------------------------
   REACT QUERY CLIENT (SINGLETON)
----------------------------------------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* -----------------------------------------------------
   DEV HEALTH CHECK
----------------------------------------------------- */

function DevHealthCheckButton() {
  if (!__DEV__) return null;

  return (
    <View style={styles.devButton}>
      <Button
        title="Test Backend"
        onPress={async () => {
          try {
            const baseUrl =
              Constants.expoConfig?.extra?.apiUrl ||
              'http://localhost:8080';

            const res = await fetch(`${baseUrl.replace('/api/v1', '')}/health`);
            const data = await res.json();
            alert(`Backend OK:\n${JSON.stringify(data, null, 2)}`);
          } catch (e: any) {
            alert(`Backend Error:\n${e.message}`);
          }
        }}
      />
    </View>
  );
}

/* -----------------------------------------------------
   NAV STACK
----------------------------------------------------- */

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(restaurant)" options={{ headerShown: false }} />

        <Stack.Screen
          name="login"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        <Stack.Screen
          name="signup"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        <Stack.Screen
          name="partner"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        <Stack.Screen
          name="restaurant/[id]"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="booking/[id]"
          options={{ title: 'Book a Table', presentation: 'modal' }}
        />

        <Stack.Screen
          name="service-booking/[id]"
          options={{ title: 'Book Service', presentation: 'modal' }}
        />

        <Stack.Screen name="+not-found" />
      </Stack>

      {/* DEV ONLY */}
      <DevHealthCheckButton />
    </>
  );
}

/* -----------------------------------------------------
   ROOT LAYOUT
----------------------------------------------------- */

export default function RootLayout() {
  useEffect(() => {
    setupAuth();
    SplashScreen.hideAsync();

    if (__DEV__) {
      console.log('🚀 App started');
      console.log('📱 Platform:', Platform.OS);
      console.log(
        '🌐 API URL:',
        Constants.expoConfig?.extra?.apiUrl || 'Not configured'
      );
    }
  }, []);

  const setupAuth = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Auth session error:', error);
        return;
      }

      if (session?.access_token) {
        api.setAuthToken(session.access_token);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth event:', event);

        if (session?.access_token) {
          api.setAuthToken(session.access_token);
        } else {
          api.setAuthToken(null);
        }

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries();
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('❌ Auth setup error:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/* -----------------------------------------------------
   STYLES
----------------------------------------------------- */

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    right: 20,
    zIndex: 999,
  },
});
