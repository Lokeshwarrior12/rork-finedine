import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface WasteEntry {
  id: string;
  itemName: string;
  quantity: string;
  date: string;
  time: string;
}

const mockWasteEntries: WasteEntry[] = [
  { id: '1', itemName: 'Chicken Breast', quantity: '2.5 kg', date: '2026-01-24', time: '09:30' },
  { id: '2', itemName: 'Fresh Basil', quantity: '3 bunches', date: '2026-01-24', time: '10:15' },
  { id: '3', itemName: 'Tomato Sauce', quantity: '1.5 L', date: '2026-01-23', time: '22:00' },
  { id: '4', itemName: 'Mozzarella', quantity: '0.8 kg', date: '2026-01-23', time: '14:30' },
  { id: '5', itemName: 'Pasta Carbonara', quantity: '2 portions', date: '2026-01-22', time: '19:45' },
  { id: '6', itemName: 'Mixed Salad', quantity: '1.2 kg', date: '2026-01-22', time: '12:00' },
  { id: '7', itemName: 'Bread Rolls', quantity: '8 pcs', date: '2026-01-21', time: '21:00' },
  { id: '8', itemName: 'Salmon Fillet', quantity: '0.6 kg', date: '2026-01-21', time: '15:30' },
];

const mockRecommendations = [
  {
    id: '1',
    title: 'Reduce Chicken Order by 15%',
    description: 'Chicken has been consistently wasted. Consider reducing weekly orders.',
    savings: '$45/mo',
  },
  {
    id: '2',
    title: 'Improve Herb Storage',
    description: 'Fresh herbs spoiling quickly. Use herb keepers or adjust temperature.',
    savings: '$25/mo',
  },
  {
    id: '3',
    title: 'Batch Prepare Sauces',
    description: 'Tomato sauce overproduction detected. Prepare smaller batches.',
    savings: '$30/mo',
  },
];

export default function FoodWasteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(mockWasteEntries);
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const styles = createStyles(colors, isDark);

  const analytics = useMemo(() => {
    const totalEntries = wasteEntries.length;
    const uniqueItems = new Set(wasteEntries.map(e => e.itemName)).size;
    const topWasted = Object.entries(
      wasteEntries.reduce((acc, entry) => {
        acc[entry.itemName] = (acc[entry.itemName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalEntries, uniqueItems, topWasted };
  }, [wasteEntries]);

  const handleAddEntry = () => {
    if (!newItemName.trim() || !newQuantity.trim()) {
      Alert.alert('Error', 'Please enter both item name and quantity');
      return;
    }

    const now = new Date();
    const newEntry: WasteEntry = {
      id: `waste_${Date.now()}`,
      itemName: newItemName.trim(),
      quantity: newQuantity.trim(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    };

    setWasteEntries(prev => [newEntry, ...prev]);
    setNewItemName('');
    setNewQuantity('');
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this waste record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setWasteEntries(prev => prev.filter(e => e.id !== id)) },
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Food Waste</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Trash2 size={18} color={activeTab === 'records' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>Records</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} color={activeTab === 'analytics' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
        </Pressable>
      </View>

      {activeTab === 'records' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
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
              <Pressable style={styles.addBtn} onPress={handleAddEntry}>
                <Plus size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.spreadsheet}>
            <View style={styles.spreadsheetHeader}>
              <Text style={[styles.spreadsheetHeaderCell, styles.cellName]}>Item Name</Text>
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
                  style={[styles.spreadsheetCell, styles.cellAction]}
                  onPress={() => handleDeleteEntry(entry.id)}
                >
                  <Trash2 size={16} color={colors.error} />
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Wasted Items</Text>
            {analytics.topWasted.map(([item, count], index) => (
              <View key={item} style={styles.topItem}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>#{index + 1}</Text>
                </View>
                <Text style={styles.topItemName}>{item}</Text>
                <Text style={styles.topItemCount}>{count}x</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            {mockRecommendations.map((rec) => (
              <View key={rec.id} style={styles.recCard}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDesc}>{rec.description}</Text>
                <Text style={styles.recSavings}>Potential savings: {rec.savings}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
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
  tabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  addSection: {
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  addTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  addInputName: {
    flex: 2,
  },
  addInputQty: {
    flex: 1,
  },
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
    fontWeight: '700' as const,
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
  spreadsheetRowAlt: {
    backgroundColor: colors.backgroundSecondary,
  },
  spreadsheetCell: {
    fontSize: 14,
    color: colors.text,
  },
  cellName: {
    flex: 2,
    paddingRight: 8,
  },
  cellQty: {
    flex: 1,
    textAlign: 'center',
  },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
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
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
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
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
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
    fontWeight: '700' as const,
    color: colors.primary,
  },
  topItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  topItemCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.error,
  },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  recSavings: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.success,
  },
});
