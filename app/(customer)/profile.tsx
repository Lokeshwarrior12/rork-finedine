import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  CreditCard,
  Award,
  Star,
  ChevronRight,
  Edit3,
  Moon,
  Sun,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Settings,
  Bookmark,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const menuItems = [
    { icon: Bookmark, label: 'My Bookings', route: '/(customer)/bookings' },
    { icon: Heart, label: 'Favorites', route: '/(customer)/favorites', badge: user?.favorites.length },
    { icon: Bell, label: 'Notifications', route: '/(customer)/notifications' },
    { icon: Calendar, label: 'Referral Program', route: '/(customer)/referral' },
    { icon: Shield, label: 'Privacy & Security', route: null },
    { icon: HelpCircle, label: 'Help & Support', route: null },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable style={styles.settingsBtn}>
              <Settings size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {user?.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={40} color={colors.textMuted} />
                  </View>
                )}
                <Pressable style={styles.editAvatarButton}>
                  <Edit3 size={14} color="#fff" />
                </Pressable>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'guest@email.com'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.accentLight }]}>
                  <Award size={20} color={colors.accent} />
                </View>
                <Text style={styles.statValue}>{user?.points || 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.errorLight }]}>
                  <Heart size={20} color={colors.error} />
                </View>
                <Text style={styles.statValue}>{user?.favorites.length || 0}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
                  <Star size={20} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeCard}>
            <View style={styles.themeRow}>
              <View style={styles.themeLeft}>
                {isDark ? (
                  <Moon size={22} color={colors.primary} />
                ) : (
                  <Sun size={22} color={colors.primary} />
                )}
                <View>
                  <Text style={styles.themeLabel}>Dark Mode</Text>
                  <Text style={styles.themeDesc}>
                    {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isDark ? colors.primary : colors.surface}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user?.name || '-'}</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Mail size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Phone size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.address || '-'}</Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <View style={styles.cardVisual}>
              <CreditCard size={28} color="#fff" />
              <Text style={styles.cardNumber}>•••• •••• •••• {user?.cardDetails?.lastFour || '0000'}</Text>
            </View>
            <View style={styles.cardDetails}>
              <View>
                <Text style={styles.cardLabel}>Card Type</Text>
                <Text style={styles.cardValue}>{user?.cardDetails?.cardType || 'N/A'}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>Expires</Text>
                <Text style={styles.cardValue}>{user?.cardDetails?.expiryDate || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <Pressable 
                  style={styles.menuRow}
                  onPress={() => item.route && router.push(item.route as any)}
                >
                  <View style={styles.menuLeft}>
                    <item.icon size={22} color={colors.textSecondary} />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge !== undefined && item.badge > 0 && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>
                </Pressable>
                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    backgroundColor: colors.surface,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    paddingHorizontal: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  themeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 48,
  },
  paymentCard: {
    backgroundColor: isDark ? '#1E3A5F' : '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardVisual: {
    padding: 20,
    gap: 16,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 52,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.errorLight,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.error,
  },
  versionText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});
