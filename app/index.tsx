import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Store, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { API_URL } from '@/lib/config';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(
        (user.role === 'customer'
          ? '/(customer)/home'
          : '/(restaurant)/dashboard') as Href
      );
    }
  }, [user, isLoading, router]);

  async function testBackend() {
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      Alert.alert('Backend Connected ✅', JSON.stringify(data, null, 2));
    } catch (e: any) {
      Alert.alert('Backend Error ❌', e.message);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={StyleSheet.absoluteFill}
        />
        <Utensils size={60} color={Colors.surface} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.decorCircle, styles.circle1]} />
      <View style={[styles.decorCircle, styles.circle2]} />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Utensils size={48} color={Colors.surface} />
          </View>
          <Text style={styles.logoText}>PrimeDine</Text>
          <Text style={styles.tagline}>Discover • Dine • Save</Text>
        </View>

        <View style={styles.cardsContainer}>
          <Pressable style={styles.card} onPress={() => router.push('/login?role=customer' as Href)}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.cardGradient}
            >
              <Utensils size={32} color={Colors.surface} />
              <Text style={styles.cardTitle}>I&apos;m a Customer</Text>
              <ChevronRight size={24} color={Colors.surface} />
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push('/login?role=restaurant_owner' as Href)}>
            <LinearGradient
              colors={[Colors.secondary, '#2D2D4A']}
              style={styles.cardGradient}
            >
              <Store size={32} color={Colors.primary} />
              <Text style={styles.cardTitle}>Restaurant Owner</Text>
              <ChevronRight size={24} color={Colors.surface} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* 🔥 BACKEND TEST BUTTON */}
        <Pressable style={styles.debugButton} onPress={testBackend}>
          <Text style={styles.debugText}>Test Backend Connection</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(232,93,4,0.1)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  logoContainer: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '700', color: Colors.surface },
  tagline: { fontSize: 16, color: Colors.textLight },
  cardsContainer: { gap: 16 },
  card: { borderRadius: 20, overflow: 'hidden' },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: Colors.surface },
  debugButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  debugText: { color: Colors.surface, fontWeight: '600' },
});
