import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { api } from '@/lib/api';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  restaurantName?: string;
  restaurantImage?: string;
  restaurantId?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

const isNotificationRead = (n: AppNotification): boolean => {
  return n.read === true || n.isRead === true;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // REAL API QUERY - Fetch notifications from backend
  const { 
    data: notificationsResponse, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('🔄 Fetching notifications from API...');
      const result = await api.getNotifications();
      console.log('✅ Notifications fetched:', result.data?.length || 0);
      return result;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // REAL API MUTATION - Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔄 Marking notification as read:', notificationId);
      return await api.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('❌ Failed to mark as read:', error);
    },
  });

  // REAL API MUTATION - Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Marking all notifications as read...');
      return await api.markAllNotificationsRead();
    },
    onSuccess: () => {
      console.log('✅ All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error) => {
      console.error('❌ Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    },
  });

  // REAL API MUTATION - Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔄 Deleting notification:', notificationId);
      return await api.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      console.log('✅ Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (error) => {
      console.error('❌ Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    },
  });

  const notifications = (notificationsResponse?.data || []) as AppNotification[];
  const unreadCount = notifications.filter(n => !isNotificationRead(n)).length;
  const styles = createStyles(colors, isDark);

  const getNotificationIcon = (type: string) => {
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

  const handleNotificationPress = async (notification: AppNotification) => {
    await Haptics.selectionAsync();
    
    // Mark as read if not already read
    if (!isNotificationRead(notification)) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to restaurant if associated
    if (notification.restaurantId) {
      router.push(`/(customer)/restaurant/${notification.restaurantId}` as any);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    markAllReadMutation.mutate();
  };

  const deleteNotification = async (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotificationMutation.mutate(id),
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading State
  if (isLoading && !notificationsResponse) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading notifications...</Text>
      </View>
    );
  }

  // Error State
  if (error && !notificationsResponse) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Bell size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Unable to load notifications</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Please check your connection'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

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
          <Pressable 
            style={styles.markReadButton} 
            onPress={markAllAsRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <CheckCircle size={18} color={colors.primary} />
                <Text style={styles.markReadText}>Mark all read</Text>
              </>
            )}
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
                !isNotificationRead(notification) && styles.notificationUnread,
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
                      {getNotificationIcon(notification.type as string)}
                    </View>
                  )}
                </View>
                
                <View style={styles.notificationBody}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.titleRow}>
                      {!isNotificationRead(notification) && <View style={styles.unreadDot} />}
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.notificationTime}>{notification.createdAt}</Text>
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  {(notification as AppNotification).restaurantName && (
                    <View style={styles.restaurantTag}>
                      <Text style={styles.restaurantTagText}>{(notification as AppNotification).restaurantName}</Text>
                    </View>
                  )}
                </View>

                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                  disabled={deleteNotificationMutation.isPending}
                >
                  {deleteNotificationMutation.isPending && 
                   deleteNotificationMutation.variables === notification.id ? (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  ) : (
                    <Trash2 size={16} color={colors.textMuted} />
                  )}
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
    minWidth: 100,
    justifyContent: 'center',
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
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
