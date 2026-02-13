// app/(restaurant)/food-waste.tsx
// Food Waste Tracking Screen - REAL DATABASE INTEGRATION
// Track and analyze food waste with real data from backend

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BarChart3,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface WasteEntry {
  id: string;
  itemName: string;
  quantity: string;
  date: string;
  time: string;
  restaurantId: string;
}

export default function FoodWasteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  // Get restaurant ID from user profile
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
  });

  const restaurantId = profileData?.data?.restaurantId;

  // REAL DATA: Fetch waste entries from database
  // Backend endpoint: GET /api/v1/restaurants/:id/waste-tracking
  // Database: SELECT * FROM food_waste WHERE restaurant_id = $1 ORDER BY date DESC
  const {
    data: wasteData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['food-waste', restaurantId, selectedMonth],
    queryFn: () =>
      api.getFoodWasteEntries(restaurantId!, {
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
      }),
    enabled: !!restaurantId,
  });

  // REAL DATA: Create waste entry
  // Backend endpoint: POST /api/v1/restaurants/:id/waste-tracking
  // Database: INSERT INTO food_waste (restaurant_id, item_name, quantity, date, time)
  const createWasteMutation = useMutation({
    mutationFn: (data: any) => api.createFoodWasteEntry(restaurantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-waste', restaurantId] });
      setNewItemName('');
      setNewQuantity('');
      Alert.alert('Success', 'Waste entry added');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add entry');
    },
  });

  // REAL DATA: Delete waste entry
  // Backend endpoint: DELETE /api/v1/waste-tracking/:id
  // Database: DELETE FROM food_waste WHERE id = $1 AND restaurant_id = $2
  const deleteWasteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFoodWasteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-waste', restaurantId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete entry');
    },
  });

  const wasteEntries = (wasteData?.data || []) as WasteEntry[];

  // REAL DATA: Calculate analytics from actual database entries
  const analytics = useMemo(() => {
    const totalEntries = wasteEntries.length;
    const uniqueItems = new Set(wasteEntries.map((e) => e.itemName)).size;
    const topWasted = Object.entries(
      wasteEntries.reduce((acc, entry) => {
        acc[entry.itemName] = (acc[entry.itemName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalEntries, uniqueItems, topWasted };
  }, [wasteEntries]);

  const handleAddEntry = () => {
    if (!newItemName.trim() || !newQuantity.trim()) {
      Alert.alert('Error', 'Please enter both item name and quantity');
      return;
    }

    const now = new Date();
    const entryData = {
      itemName: newItemName.trim(),
      quantity: newQuantity.trim(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    };

    createWasteMutation.mutate(entryData);
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this waste record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWasteMutation.mutate(id),
      },
    ]);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const styles = createStyles(colors, isDark);

  // LOADING STATE
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading waste tracking...</Text>
      </View>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          },
        ]}
      >
        <AlertCircle size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Failed to Load Data</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Something went wrong'}
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
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Food Waste Tracking</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Trash2
            size={18}
            color={activeTab === 'records' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
            Records
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <BarChart3
            size={18}
            color={activeTab === 'analytics' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </Pressable>
      </View>

      {activeTab === 'records' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Add Entry Form */}
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>Add Waste Entry</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, styles.addInputName]}
                placeholder="Item Name"
                placeholderTextColor={colors.placeholder}
                value={newItemName}
                onChangeText={setNewItemName}
              />
              <TextInput
                style={[styles.addInput, styles.addInputQty]}
                placeholder="Qty"
                placeholderTextColor={colors.placeholder}
                value={newQuantity}
                onChangeText={setNewQuantity}
              />
              <Pressable
                style={styles.addBtn}
                onPress={handleAddEntry}
                disabled={createWasteMutation.isPending}
              >
                {createWasteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Plus size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Waste Entries Table - REAL DATA */}
          <View style={styles.spreadsheet}>
            <View style={styles.spreadsheetHeader}>
              <Text style={[styles.spreadsheetHeaderCell, styles.cellName]}>
                Item Name
              </Text>
              <Text style={[styles.spreadsheetHeaderCell, styles.cellQty]}>Quantity</Text>
              <Text style={[styles.spreadsheetHeaderCell, styles.cellDate]}>Date</Text>
              <Text style={[styles.spreadsheetHeaderCell, styles.cellAction]}></Text>
            </View>

            {wasteEntries.map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.spreadsheetRow,
                  index % 2 === 0 && styles.spreadsheetRowAlt,
                ]}
              >
                <Text style={[styles.spreadsheetCell, styles.cellName]} numberOfLines={1}>
                  {entry.itemName}
                </Text>
                <Text style={[styles.spreadsheetCell, styles.cellQty]}>
                  {entry.quantity}
                </Text>
                <Text style={[styles.spreadsheetCell, styles.cellDate]}>
                  {entry.date.slice(5)}
                </Text>
                <Pressable
                  style={styles.cellAction}
                  onPress={() => handleDeleteEntry(entry.id)}
                  disabled={deleteWasteMutation.isPending}
                >
                  {deleteWasteMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Trash2 size={16} color={colors.error} />
                  )}
                </Pressable>
              </View>
            ))}

            {wasteEntries.length === 0 && (
              <View style={styles.emptyState}>
                <Trash2 size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No waste records yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Pressable style={styles.navBtn} onPress={() => navigateMonth(-1)}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <View style={styles.monthDisplay}>
              <Calendar size={18} color={colors.primary} />
              <Text style={styles.monthText}>{formatMonth(selectedMonth)}</Text>
            </View>
            <Pressable style={styles.navBtn} onPress={() => navigateMonth(1)}>
              <ChevronRight size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Stats - REAL DATA */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <TrendingDown size={24} color={colors.error} />
              <Text style={styles.statValue}>{analytics.totalEntries}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statCard}>
              <Trash2 size={24} color={colors.warning} />
              <Text style={styles.statValue}>{analytics.uniqueItems}</Text>
              <Text style={styles.statLabel}>Unique Items</Text>
            </View>
          </View>

          {/* Top Wasted Items - REAL DATA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Wasted Items</Text>
            {analytics.topWasted.length > 0 ? (
              analytics.topWasted.map(([item, count], index) => (
                <View key={item} style={styles.topItem}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.topItemName}>{item}</Text>
                  <Text style={styles.topItemCount}>{count}x</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No data available for this month</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingText: { fontSize: 14, color: colors.textSecondary, marginTop: 16 },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      gap: 6,
    },
    tabActive: { backgroundColor: colors.primaryLight },
    tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: colors.primary },
    addSection: {
      padding: 16,
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    addTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    addRow: { flexDirection: 'row', gap: 8 },
    addInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addInputName: { flex: 2 },
    addInputQty: { flex: 1 },
    addBtn: {
      width: 48,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    spreadsheet: {
      margin: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    spreadsheetHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    spreadsheetHeaderCell: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
    },
    spreadsheetRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    spreadsheetRowAlt: { backgroundColor: colors.backgroundSecondary },
    spreadsheetCell: { fontSize: 14, color: colors.text },
    cellName: { flex: 2, paddingRight: 8 },
    cellQty: { flex: 1, textAlign: 'center' },
    cellDate: {
      flex: 1,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 12,
    },
    cellAction: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 12,
      textAlign: 'center',
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    navBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monthText: { fontSize: 16, fontWeight: '600', color: colors.text },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    topItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    topItemRank: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    topItemRankText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    topItemName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    topItemCount: { fontSize: 14, fontWeight: '600', color: colors.error },
  });
