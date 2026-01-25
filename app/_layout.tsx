import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { trpc, trpcClient } from '@/lib/trpc';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

/* -----------------------------------------------------
   SPLASH SCREEN
----------------------------------------------------- */

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
    </>
  );
}

/* -----------------------------------------------------
   ROOT LAYOUT
----------------------------------------------------- */

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
