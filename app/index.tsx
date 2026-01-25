import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Store, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

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
      if (user.role === 'customer') {
        router.replace('/(customer)/home' as any);
      } else {
        router.replace('/(restaurant)/dashboard' as any);
      }
    }
  }, [user, isLoading, router]);

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
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Utensils size={48} color={Colors.surface} />
          </View>
          <Text style={styles.logoText}>FineDine</Text>
          <Text style={styles.tagline}>Discover • Dine • Save</Text>
        </View>

        <View style={styles.cardsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/login?role=customer')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Utensils size={32} color={Colors.surface} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>I&apos;m a Customer</Text>
                <Text style={styles.cardSubtitle}>Find deals & book tables</Text>
              </View>
              <ChevronRight size={24} color={Colors.surface} />
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/login?role=restaurant_owner')}
          >
            <LinearGradient
              colors={[Colors.secondary, '#2D2D4A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(232, 93, 4, 0.2)' }]}>
                <Store size={32} color={Colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Restaurant Owner</Text>
                <Text style={styles.cardSubtitle}>Manage your offers</Text>
              </View>
              <ChevronRight size={24} color={Colors.surface} />
            </LinearGradient>
          </Pressable>
        </View>
        // ... existing imports ...

        <Tabs.Screen
          name="test"
          options={{
            title: 'Test DB',
            tabBarIcon: ({ color, size }) => (
              <Icon size={size} color={color} name="database" /> // or any lucide icon
              ),
          }}
          />

        <Pressable 
          style={styles.partnerLink}
          onPress={() => router.push('/partner')}
        >
          <Text style={styles.partnerText}>Want to become a partner?</Text>
          <Text style={styles.partnerCta}>Register your restaurant</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.surface,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 8,
    letterSpacing: 2,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  partnerLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  partnerText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  partnerCta: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
  },
});
