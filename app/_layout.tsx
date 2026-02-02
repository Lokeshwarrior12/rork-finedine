import React, { useEffect } from 'react';
import { View, Button, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { API_URL } from '@/lib/config';
import { trpc, trpcClient } from '@/lib/trpc';

/* -----------------------------------------------------
   SPLASH SCREEN
----------------------------------------------------- */

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/* -----------------------------------------------------
   DEV HEALTH CHECK BUTTON
----------------------------------------------------- */

function DevHealthCheckButton() {
  if (!__DEV__) return null;

  return (
    <View style={styles.devButton}>
      <Button
        title="Test Backend"
        onPress={async () => {
          try {
            const res = await fetch(`${API_URL}/health`);
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
