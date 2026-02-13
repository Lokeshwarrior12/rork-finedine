import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Flame,
  Ticket,
  Award,
  LogOut,
  ChevronRight,
  Gift,
  Store,
  Bell,
  HelpCircle,
  FileText,
  LucideIcon,
  Heart,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  route: string | null;
  color: string;
  badge?: string;
  subtitle?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const menuItems: MenuSection[] = [
    {
      title: 'Dashboard',
      items: [
        { icon: User, label: 'Profile', route: '/(customer)/profile', color: Colors.primary },
        { icon: Flame, label: 'Hot Deals', route: '/(customer)/deals', color: Colors.error },
        { icon: Ticket, label: 'My Coupons', route: '/(customer)/coupons', color: Colors.accent },
        { icon: Award, label: 'Rewards', route: '/(customer)/rewards', color: Colors.success, badge: `${user?.points || 0} pts` },
        { icon: Heart, label: 'Favorites', route: '/(customer)/favorites', color: Colors.error },
        { icon: Calendar, label: 'My Bookings', route: '/(customer)/bookings', color: Colors.primary },
      ],
    },
    {
      title: 'Actions',
      items: [
        { icon: Gift, label: 'Refer a Friend', route: '/(customer)/referral', color: Colors.primary, subtitle: 'Get 50 pts + free meal deal' },
        { icon: Store, label: 'Become a Partner', route: '/partner', color: Colors.secondary },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', route: '/(customer)/notifications', color: Colors.textSecondary },
        { icon: HelpCircle, label: 'Help & Support', route: null, color: Colors.textSecondary },
        { icon: FileText, label: 'Terms & Privacy', route: null, color: Colors.textSecondary },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => item.route && router.push(item.route as any)}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : (
                      <ChevronRight size={20} color={Colors.textLight} />
                    )}
                  </Pressable>
                  {itemIndex < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 70,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
});
