import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Package,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Lightbulb,
  BarChart3,
  RefreshCcw,
  Leaf,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FoodWasteRecord, WasteRecommendation } from '@/types';

const { width } = Dimensions.get('window');

const WASTE_REASONS = [
  { key: 'expired', label: 'Expired', color: '#ef4444' },
  { key: 'spoiled', label: 'Spoiled', color: '#f97316' },
  { key: 'overproduction', label: 'Overproduction', color: '#eab308' },
  { key: 'customer_return', label: 'Customer Return', color: '#3b82f6' },
  { key: 'preparation_error', label: 'Prep Error', color: '#8b5cf6' },
  { key: 'other', label: 'Other', color: '#6b7280' },
] as const;

const CATEGORIES = ['All', 'Meat', 'Vegetables', 'Dairy', 'Dry Goods', 'Prepared', 'Beverages'];

const mockWasteRecords: FoodWasteRecord[] = [
  {
    id: '1',
    restaurantId: '1',
    itemName: 'Chicken Breast',
    category: 'Meat',
    quantity: 2.5,
    unit: 'kg',
    reason: 'expired',
    costPerUnit: 8.99,
    totalCost: 22.48,
    date: '2026-01-24',
    time: '09:30',
    notes: 'Past expiration date',
  },
  {
    id: '2',
    restaurantId: '1',
    itemName: 'Fresh Basil',
    category: 'Vegetables',
    quantity: 3,
    unit: 'bunches',
    reason: 'spoiled',
    costPerUnit: 1.99,
    totalCost: 5.97,
    date: '2026-01-24',
    time: '10:15',
  },
  {
    id: '3',
    restaurantId: '1',
    itemName: 'Tomato Sauce',
    category: 'Prepared',
    quantity: 1.5,
    unit: 'liters',
    reason: 'overproduction',
    costPerUnit: 4.50,
    totalCost: 6.75,
    date: '2026-01-23',
    time: '22:00',
  },
  {
    id: '4',
    restaurantId: '1',
    itemName: 'Mozzarella',
    category: 'Dairy',
    quantity: 0.8,
    unit: 'kg',
    reason: 'spoiled',
    costPerUnit: 15.99,
    totalCost: 12.79,
    date: '2026-01-23',
    time: '14:30',
  },
  {
    id: '5',
    restaurantId: '1',
    itemName: 'Pasta Carbonara',
    category: 'Prepared',
    quantity: 2,
    unit: 'portions',
    reason: 'customer_return',
    costPerUnit: 8.00,
    totalCost: 16.00,
    date: '2026-01-22',
    time: '19:45',
  },
  {
    id: '6',
    restaurantId: '1',
    itemName: 'Mixed Salad',
    category: 'Vegetables',
    quantity: 1.2,
    unit: 'kg',
    reason: 'preparation_error',
    costPerUnit: 6.00,
    totalCost: 7.20,
    date: '2026-01-22',
    time: '12:00',
  },
];

const mockRecommendations: WasteRecommendation[] = [
  {
    id: '1',
    type: 'ordering',
    title: 'Reduce Chicken Order by 15%',
    description: 'Chicken has been consistently wasted due to expiration. Consider reducing weekly orders.',
    impact: 'high',
    potentialSavings: 45.00,
    basedOn: 'Last 30 days waste data',
  },
  {
    id: '2',
    type: 'storage',
    title: 'Improve Herb Storage',
    description: 'Fresh herbs are spoiling quickly. Consider using herb keepers or adjusting storage temperature.',
    impact: 'medium',
    potentialSavings: 25.00,
    basedOn: 'Repeated spoilage of basil, parsley',
  },
  {
    id: '3',
    type: 'preparation',
    title: 'Batch Prepare Sauces',
    description: 'Tomato sauce overproduction detected. Prepare smaller batches more frequently.',
    impact: 'medium',
    potentialSavings: 30.00,
    basedOn: 'Evening waste patterns',
  },
  {
    id: '4',
    type: 'rotation',
    title: 'Implement FIFO for Dairy',
    description: 'Dairy products expiring before use. Ensure first-in-first-out rotation.',
    impact: 'high',
    potentialSavings: 50.00,
    basedOn: 'Mozzarella, cream waste records',
  },
];

export default function FoodWasteScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [wasteRecords, setWasteRecords] = useState<FoodWasteRecord[]>(mockWasteRecords);
  const [activeTab, setActiveTab] = useState<'records' | 'analytics'>('records');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Meat',
    quantity: '',
    unit: 'kg',
    reason: 'expired' as FoodWasteRecord['reason'],
    costPerUnit: '',
    notes: '',
  });

  const styles = createStyles(colors, isDark);

  const filteredRecords = useMemo(() => {
    return wasteRecords.filter(record => {
      const matchesCategory = selectedCategory === 'All' || record.category === selectedCategory;
      const matchesSearch = record.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [wasteRecords, selectedCategory, searchQuery]);

  const analytics = useMemo(() => {
    const thisMonth = wasteRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === selectedMonth.getMonth() &&
             recordDate.getFullYear() === selectedMonth.getFullYear();
    });

    const totalCost = thisMonth.reduce((sum, r) => sum + r.totalCost, 0);
    const totalQuantity = thisMonth.reduce((sum, r) => sum + r.quantity, 0);

    const byCategory = CATEGORIES.filter(c => c !== 'All').map(category => {
      const categoryRecords = thisMonth.filter(r => r.category === category);
      const cost = categoryRecords.reduce((sum, r) => sum + r.totalCost, 0);
      return {
        category,
        cost,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      };
    }).filter(c => c.cost > 0).sort((a, b) => b.cost - a.cost);

    const byReason = WASTE_REASONS.map(reason => {
      const reasonRecords = thisMonth.filter(r => r.reason === reason.key);
      const cost = reasonRecords.reduce((sum, r) => sum + r.totalCost, 0);
      return {
        reason: reason.label,
        color: reason.color,
        cost,
        count: reasonRecords.length,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      };
    }).filter(r => r.count > 0).sort((a, b) => b.cost - a.cost);

    const topWasted = Object.values(
      thisMonth.reduce((acc, record) => {
        if (!acc[record.itemName]) {
          acc[record.itemName] = {
            itemName: record.itemName,
            category: record.category,
            totalCost: 0,
            totalQuantity: 0,
            count: 0,
          };
        }
        acc[record.itemName].totalCost += record.totalCost;
        acc[record.itemName].totalQuantity += record.quantity;
        acc[record.itemName].count += 1;
        return acc;
      }, {} as Record<string, { itemName: string; category: string; totalCost: number; totalQuantity: number; count: number }>)
    ).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);

    return { totalCost, totalQuantity, byCategory, byReason, topWasted, recordCount: thisMonth.length };
  }, [wasteRecords, selectedMonth]);

  const handleAddRecord = () => {
    if (!formData.itemName || !formData.quantity || !formData.costPerUnit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const costPerUnit = parseFloat(formData.costPerUnit);
    const now = new Date();

    const newRecord: FoodWasteRecord = {
      id: `waste_${Date.now()}`,
      restaurantId: '1',
      itemName: formData.itemName,
      category: formData.category,
      quantity,
      unit: formData.unit,
      reason: formData.reason,
      costPerUnit,
      totalCost: quantity * costPerUnit,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      notes: formData.notes || undefined,
    };

    setWasteRecords(prev => [newRecord, ...prev]);
    setShowAddModal(false);
    setFormData({
      itemName: '',
      category: 'Meat',
      quantity: '',
      unit: 'kg',
      reason: 'expired',
      costPerUnit: '',
      notes: '',
    });
  };

  const handleDeleteRecord = (id: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this waste record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setWasteRecords(prev => prev.filter(r => r.id !== id)) },
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

  const getReasonColor = (reason: string) => {
    return WASTE_REASONS.find(r => r.key === reason)?.color || colors.textMuted;
  };

  const getReasonLabel = (reason: string) => {
    return WASTE_REASONS.find(r => r.key === reason)?.label || reason;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Trash2 size={24} color={colors.error} />
          <Text style={styles.headerTitle}>Food Waste</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Record</Text>
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Package size={18} color={activeTab === 'records' ? colors.primary : colors.textSecondary} />
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {activeTab === 'records' ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.errorLight }]}>
                  <DollarSign size={20} color={colors.error} />
                </View>
                <Text style={[styles.statValue, { color: colors.error }]}>${analytics.totalCost.toFixed(0)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
                  <Package size={20} color={colors.warning} />
                </View>
                <Text style={styles.statValue}>{analytics.recordCount}</Text>
                <Text style={styles.statLabel}>Records</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
                  <TrendingDown size={20} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{analytics.totalQuantity.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Units Wasted</Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.recordsList}>
              {filteredRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <Leaf size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No waste records</Text>
                  <Text style={styles.emptyText}>Great job! Keep tracking to minimize waste.</Text>
                </View>
              ) : (
                filteredRecords.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={styles.recordInfo}>
                        <Text style={styles.recordName}>{record.itemName}</Text>
                        <Text style={styles.recordCategory}>{record.category}</Text>
                      </View>
                      <View style={[styles.reasonBadge, { backgroundColor: `${getReasonColor(record.reason)}20` }]}>
                        <Text style={[styles.reasonText, { color: getReasonColor(record.reason) }]}>
                          {getReasonLabel(record.reason)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recordDetails}>
                      <View style={styles.recordDetail}>
                        <Package size={14} color={colors.textSecondary} />
                        <Text style={styles.recordDetailText}>{record.quantity} {record.unit}</Text>
                      </View>
                      <View style={styles.recordDetail}>
                        <DollarSign size={14} color={colors.error} />
                        <Text style={[styles.recordDetailText, { color: colors.error, fontWeight: '600' as const }]}>
                          ${record.totalCost.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.recordDetail}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={styles.recordDetailText}>{record.date}</Text>
                      </View>
                      <View style={styles.recordDetail}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={styles.recordDetailText}>{record.time}</Text>
                      </View>
                    </View>

                    {record.notes && (
                      <Text style={styles.recordNotes}>{record.notes}</Text>
                    )}

                    <Pressable style={styles.deleteBtn} onPress={() => handleDeleteRecord(record.id)}>
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <>
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

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Monthly Summary</Text>
                <View style={[styles.trendBadge, { backgroundColor: colors.errorLight }]}>
                  <TrendingUp size={14} color={colors.error} />
                  <Text style={[styles.trendText, { color: colors.error }]}>+12%</Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>${analytics.totalCost.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>Total Cost</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{analytics.recordCount}</Text>
                  <Text style={styles.summaryLabel}>Incidents</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{analytics.totalQuantity.toFixed(1)}</Text>
                  <Text style={styles.summaryLabel}>Units</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Waste by Category</Text>
              {analytics.byCategory.length > 0 ? (
                analytics.byCategory.map((item, index) => (
                  <View key={item.category} style={styles.barItem}>
                    <View style={styles.barHeader}>
                      <Text style={styles.barLabel}>{item.category}</Text>
                      <Text style={styles.barValue}>${item.cost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.barFill, 
                          { 
                            width: `${item.percentage}%`,
                            backgroundColor: colors.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.barPercentage}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No data for this month</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Waste by Reason</Text>
              {analytics.byReason.length > 0 ? (
                <View style={styles.reasonGrid}>
                  {analytics.byReason.map((item) => (
                    <View key={item.reason} style={styles.reasonCard}>
                      <View style={[styles.reasonDot, { backgroundColor: item.color }]} />
                      <Text style={styles.reasonLabel}>{item.reason}</Text>
                      <Text style={styles.reasonCount}>{item.count} times</Text>
                      <Text style={[styles.reasonCost, { color: colors.error }]}>${item.cost.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No data for this month</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Wasted Items</Text>
              {analytics.topWasted.length > 0 ? (
                analytics.topWasted.map((item, index) => (
                  <View key={item.itemName} style={styles.topItem}>
                    <View style={styles.topItemRank}>
                      <Text style={styles.topItemRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.topItemInfo}>
                      <Text style={styles.topItemName}>{item.itemName}</Text>
                      <Text style={styles.topItemCategory}>{item.category} • {item.count} incidents</Text>
                    </View>
                    <Text style={[styles.topItemCost, { color: colors.error }]}>${item.totalCost.toFixed(2)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No data for this month</Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              {mockRecommendations.map((rec) => (
                <View key={rec.id} style={styles.recommendationCard}>
                  <View style={styles.recHeader}>
                    <View style={[styles.recTypeBadge, { backgroundColor: colors.primaryLight }]}>
                      <RefreshCcw size={12} color={colors.primary} />
                      <Text style={styles.recTypeText}>{rec.type}</Text>
                    </View>
                    <View style={[styles.impactBadge, { backgroundColor: `${getImpactColor(rec.impact)}20` }]}>
                      <Text style={[styles.impactText, { color: getImpactColor(rec.impact) }]}>
                        {rec.impact} impact
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDescription}>{rec.description}</Text>
                  <View style={styles.recFooter}>
                    <Text style={styles.recBased}>{rec.basedOn}</Text>
                    <Text style={[styles.recSavings, { color: colors.success }]}>
                      Save ~${rec.potentialSavings}/mo
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Waste</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Chicken Breast"
                  placeholderTextColor={colors.placeholder}
                  value={formData.itemName}
                  onChangeText={(text) => setFormData({ ...formData, itemName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.formChips}>
                    {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                      <Pressable
                        key={cat}
                        style={[styles.formChip, formData.category === cat && styles.formChipActive]}
                        onPress={() => setFormData({ ...formData, category: cat })}
                      >
                        <Text style={[styles.formChipText, formData.category === cat && styles.formChipTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="kg"
                    placeholderTextColor={colors.placeholder}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cost per Unit ($) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                  value={formData.costPerUnit}
                  onChangeText={(text) => setFormData({ ...formData, costPerUnit: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reason</Text>
                <View style={styles.reasonOptions}>
                  {WASTE_REASONS.map((reason) => (
                    <Pressable
                      key={reason.key}
                      style={[
                        styles.reasonOption,
                        formData.reason === reason.key && { backgroundColor: `${reason.color}20`, borderColor: reason.color },
                      ]}
                      onPress={() => setFormData({ ...formData, reason: reason.key })}
                    >
                      <View style={[styles.reasonOptionDot, { backgroundColor: reason.color }]} />
                      <Text style={[
                        styles.reasonOptionText,
                        formData.reason === reason.key && { color: reason.color },
                      ]}>
                        {reason.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Add any notes..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                />
              </View>

              {formData.quantity && formData.costPerUnit && (
                <View style={styles.totalCostPreview}>
                  <Text style={styles.totalCostLabel}>Total Cost:</Text>
                  <Text style={styles.totalCostValue}>
                    ${(parseFloat(formData.quantity || '0') * parseFloat(formData.costPerUnit || '0')).toFixed(2)}
                  </Text>
                </View>
              )}

              <Pressable style={styles.saveBtn} onPress={handleAddRecord}>
                <Check size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Record Waste</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  recordsList: {
    paddingHorizontal: 16,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  recordCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recordDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recordNotes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  barItem: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.error,
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercentage: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reasonCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reasonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  reasonCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonCost: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
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
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  topItemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topItemCost: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  recTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  recDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recBased: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  recSavings: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  formTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formChips: {
    flexDirection: 'row',
    gap: 8,
  },
  formChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  formChipTextActive: {
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  reasonOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reasonOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  totalCostPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalCostLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  totalCostValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.error,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
