import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Tag,
  Calendar,
  Heart,
  Gift,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'offer' | 'booking' | 'favorite' | 'reward' | 'general';
  title: string;
  message: string;
  restaurantName?: string;
  restaurantImage?: string;
  restaurantId?: string;
  read: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'offer',
    title: 'New Deal Available!',
    message: 'The Golden Fork just launched a 30% off weekend brunch offer. Don\'t miss out!',
    restaurantName: 'The Golden Fork',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
    restaurantId: '1',
    read: false,
    createdAt: '2 hours ago',
  },
  {
    id: 'n2',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your table for 4 at Sakura Lounge is confirmed for Jan 25 at 7:00 PM.',
    restaurantName: 'Sakura Lounge',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    restaurantId: '3',
    read: false,
    createdAt: '5 hours ago',
  },
  {
    id: 'n3',
    type: 'reward',
    title: 'Points Earned!',
    message: 'You earned 20 points for claiming a coupon. Keep collecting!',
    read: true,
    createdAt: '1 day ago',
  },
  {
    id: 'n4',
    type: 'favorite',
    title: 'New Offer from Favorite',
    message: 'Spice Garden, one of your favorites, has a new 50% BOGO offer!',
    restaurantName: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200',
    restaurantId: '2',
    read: true,
    createdAt: '2 days ago',
  },
  {
    id: 'n5',
    type: 'general',
    title: 'Coupon Expiring Soon',
    message: 'Your coupon for The Rooftop Bar expires in 3 days. Use it before it\'s gone!',
    restaurantName: 'The Rooftop Bar',
    restaurantImage: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200',
    restaurantId: '4',
    read: true,
    createdAt: '3 days ago',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const styles = createStyles(colors, isDark);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'offer':
        return <Tag size={20} color={colors.primary} />;
      case 'booking':
        return <Calendar size={20} color={colors.success} />;
      case 'favorite':
        return <Heart size={20} color={colors.error} />;
      case 'reward':
        return <Gift size={20} color={colors.accent} />;
      default:
        return <Bell size={20} color={colors.textSecondary} />;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await Haptics.selectionAsync();
    
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    if (notification.restaurantId) {
      router.push(`/restaurant/${notification.restaurantId}` as any);
    }
  };

  const markAllAsRead = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable style={styles.markReadButton} onPress={markAllAsRead}>
            <CheckCircle size={18} color={colors.primary} />
            <Text style={styles.markReadText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationLeft}>
                  {notification.restaurantImage ? (
                    <Image
                      source={{ uri: notification.restaurantImage }}
                      style={styles.restaurantImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.iconContainer}>
                      {getNotificationIcon(notification.type)}
                    </View>
                  )}
                </View>
                
                <View style={styles.notificationBody}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.titleRow}>
                      {!notification.read && <View style={styles.unreadDot} />}
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.notificationTime}>{notification.createdAt}</Text>
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  {notification.restaurantName && (
                    <View style={styles.restaurantTag}>
                      <Text style={styles.restaurantTagText}>{notification.restaurantName}</Text>
                    </View>
                  )}
                </View>

                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Trash2 size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              When your favorite restaurants launch new offers, you will see them here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  notificationUnread: {
    backgroundColor: isDark ? colors.primaryLight : '#FFF8F5',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  notificationLeft: {},
  restaurantImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  restaurantTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  restaurantTagText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
