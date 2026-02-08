import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  Check,
  X,
  MessageCircle,
  Send,
  Phone,
  ChefHat,
  Package,
  CircleCheck,
  CircleX,

  Search,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Order, OrderMessage, OrderStatus } from '@/types';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';

const { width } = Dimensions.get('window');

const mockOrders: Order[] = [
  {
    id: '1',
    restaurantId: 'r1',
    customerId: 'c1',
    customerName: 'John Smith',
    customerPhone: '+1 234 567 8901',
    orderType: 'dinein',
    items: [
      { id: '1', name: 'Butter Chicken', quantity: 2, price: 18.99 },
      { id: '2', name: 'Garlic Naan', quantity: 4, price: 3.99 },
      { id: '3', name: 'Mango Lassi', quantity: 2, price: 4.99 },
    ],
    subtotal: 59.92,
    discount: 5.99,
    total: 53.93,
    status: 'pending',
    tableNumber: 'A3',
    specialInstructions: 'Extra spicy please',
    createdAt: '2024-01-24T14:30:00Z',
    updatedAt: '2024-01-24T14:30:00Z',
    estimatedTime: 25,
    messages: [
      { id: 'm1', orderId: '1', senderId: 'c1', senderType: 'customer', message: 'Can you make the butter chicken extra spicy?', timestamp: '2024-01-24T14:31:00Z', read: true },
    ],
  },
  {
    id: '2',
    restaurantId: 'r1',
    customerId: 'c2',
    customerName: 'Sarah Johnson',
    customerPhone: '+1 234 567 8902',
    orderType: 'pickup',
    items: [
      { id: '1', name: 'Chicken Biryani', quantity: 1, price: 16.99 },
      { id: '2', name: 'Raita', quantity: 1, price: 2.99 },
    ],
    subtotal: 19.98,
    discount: 0,
    total: 19.98,
    status: 'pending',
    pickupTime: '15:30',
    createdAt: '2024-01-24T14:45:00Z',
    updatedAt: '2024-01-24T14:45:00Z',
    estimatedTime: 20,
    messages: [],
  },
  {
    id: '3',
    restaurantId: 'r1',
    customerId: 'c3',
    customerName: 'Mike Davis',
    customerPhone: '+1 234 567 8903',
    orderType: 'dinein',
    items: [
      { id: '1', name: 'Paneer Tikka', quantity: 1, price: 14.99 },
      { id: '2', name: 'Dal Makhani', quantity: 1, price: 12.99 },
      { id: '3', name: 'Jeera Rice', quantity: 2, price: 4.99 },
    ],
    subtotal: 37.96,
    discount: 3.80,
    total: 34.16,
    status: 'accepted',
    tableNumber: 'B2',
    createdAt: '2024-01-24T14:00:00Z',
    updatedAt: '2024-01-24T14:10:00Z',
    estimatedTime: 15,
    messages: [
      { id: 'm2', orderId: '3', senderId: 'r1', senderType: 'restaurant', message: 'Your order is being prepared!', timestamp: '2024-01-24T14:11:00Z', read: true },
    ],
  },
  {
    id: '4',
    restaurantId: 'r1',
    customerId: 'c4',
    customerName: 'Emily Wilson',
    customerPhone: '+1 234 567 8904',
    orderType: 'pickup',
    items: [
      { id: '1', name: 'Tandoori Chicken', quantity: 1, price: 19.99 },
    ],
    subtotal: 19.99,
    discount: 2.00,
    total: 17.99,
    status: 'preparing',
    pickupTime: '16:00',
    createdAt: '2024-01-24T13:30:00Z',
    updatedAt: '2024-01-24T13:45:00Z',
    estimatedTime: 10,
    messages: [],
  },
  {
    id: '5',
    restaurantId: 'r1',
    customerId: 'c5',
    customerName: 'David Brown',
    customerPhone: '+1 234 567 8905',
    orderType: 'dinein',
    items: [
      { id: '1', name: 'Lamb Rogan Josh', quantity: 1, price: 22.99 },
      { id: '2', name: 'Butter Naan', quantity: 2, price: 3.49 },
    ],
    subtotal: 29.97,
    discount: 0,
    total: 29.97,
    status: 'ready',
    tableNumber: 'C1',
    createdAt: '2024-01-24T13:00:00Z',
    updatedAt: '2024-01-24T13:30:00Z',
    messages: [],
  },
  {
    id: '6',
    restaurantId: 'r1',
    customerId: 'c6',
    customerName: 'Lisa Anderson',
    customerPhone: '+1 234 567 8906',
    orderType: 'pickup',
    items: [
      { id: '1', name: 'Vegetable Korma', quantity: 2, price: 13.99 },
    ],
    subtotal: 27.98,
    discount: 2.80,
    total: 25.18,
    status: 'completed',
    pickupTime: '14:00',
    createdAt: '2024-01-24T12:30:00Z',
    updatedAt: '2024-01-24T14:00:00Z',
    messages: [],
  },
  {
    id: '7',
    restaurantId: 'r1',
    customerId: 'c7',
    customerName: 'James Taylor',
    customerPhone: '+1 234 567 8907',
    orderType: 'dinein',
    items: [
      { id: '1', name: 'Fish Curry', quantity: 1, price: 18.99 },
    ],
    subtotal: 18.99,
    discount: 0,
    total: 18.99,
    status: 'rejected',
    createdAt: '2024-01-24T11:00:00Z',
    updatedAt: '2024-01-24T11:05:00Z',
    messages: [
      { id: 'm3', orderId: '7', senderId: 'r1', senderType: 'restaurant', message: 'Sorry, we are currently out of fish. Would you like to order something else?', timestamp: '2024-01-24T11:05:00Z', read: true },
    ],
  },
  {
    id: '8',
    restaurantId: 'r1',
    customerId: 'c8',
    customerName: 'Anna Martinez',
    customerPhone: '+1 234 567 8908',
    orderType: 'pickup',
    items: [
      { id: '1', name: 'Chicken Tikka Masala', quantity: 1, price: 17.99 },
    ],
    subtotal: 17.99,
    discount: 0,
    total: 17.99,
    status: 'cancelled',
    createdAt: '2024-01-24T10:00:00Z',
    updatedAt: '2024-01-24T10:15:00Z',
    messages: [],
  },
];

type TabType = 'new' | 'active' | 'history';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'New', color: '#f59e0b', bgColor: '#fef3c7', icon: Clock },
  accepted: { label: 'Accepted', color: '#3b82f6', bgColor: '#dbeafe', icon: Check },
  preparing: { label: 'Preparing', color: '#8b5cf6', bgColor: '#ede9fe', icon: ChefHat },
  ready: { label: 'Ready', color: '#10b981', bgColor: '#d1fae5', icon: Package },
  completed: { label: 'Completed', color: '#059669', bgColor: '#d1fae5', icon: CircleCheck },
  rejected: { label: 'Rejected', color: '#ef4444', bgColor: '#fee2e2', icon: CircleX },
  cancelled: { label: 'Cancelled', color: '#6b7280', bgColor: '#f3f4f6', icon: X },
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dinein' | 'pickup'>('all');

  const tabIndicator = useRef(new Animated.Value(0)).current;

  useOrderSubscription({
    onUpdate: (payload) => {
      const order = payload.new as Order;
      if (order) {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === order.id);
          return exists
            ? prev.map((o) => (o.id === order.id ? order : o))
            : [order, ...prev];
        });
      }
    },
  });
  const flatListRef = useRef<FlatList>(null);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: orders.filter(o => o.status === 'pending').length },
    { key: 'active', label: 'Active', count: orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)).length },
    { key: 'history', label: 'History', count: orders.filter(o => ['completed', 'rejected', 'cancelled'].includes(o.status)).length },
  ];

  const handleTabChange = (tab: TabType, index: number) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: index * (width - 40) / 3,
      useNativeDriver: true,
    }).start();
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    if (activeTab === 'new') {
      filtered = filtered.filter(o => o.status === 'pending');
    } else if (activeTab === 'active') {
      filtered = filtered.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status));
    } else {
      filtered = filtered.filter(o => ['completed', 'rejected', 'cancelled'].includes(o.status));
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(o => o.orderType === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleAcceptOrder = (order: Order) => {
    setOrders(prev => prev.map(o => 
      o.id === order.id ? { ...o, status: 'accepted' as OrderStatus, updatedAt: new Date().toISOString() } : o
    ));
    setShowOrderModal(false);
    Alert.alert('Order Accepted', `Order #${order.id} has been accepted`);
  };

  const handleRejectOrder = (order: Order) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setOrders(prev => prev.map(o => 
              o.id === order.id ? { ...o, status: 'rejected' as OrderStatus, updatedAt: new Date().toISOString() } : o
            ));
            setShowOrderModal(false);
          },
        },
      ]
    );
  };

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === order.id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    ));
    setShowOrderModal(false);
  };

  const handleOpenChat = (order: Order) => {
    setChatOrder(order);
    setShowChatModal(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatOrder) return;

    const message: OrderMessage = {
      id: `m${Date.now()}`,
      orderId: chatOrder.id,
      senderId: 'restaurant',
      senderType: 'restaurant',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setOrders(prev => prev.map(o => 
      o.id === chatOrder.id 
        ? { ...o, messages: [...o.messages, message] } 
        : o
    ));

    setChatOrder(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
    setNewMessage('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const styles = createStyles(colors, isDark);

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const status = statusConfig[order.status];
    const StatusIcon = status.icon;
    const hasUnreadMessages = order.messages.some(m => !m.read && m.senderType === 'customer');

    return (
      <Pressable 
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(order);
          setShowOrderModal(true);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderTypeContainer}>
            <View style={[styles.orderTypeIcon, { backgroundColor: order.orderType === 'dinein' ? colors.primaryLight : colors.accentLight }]}>
              {order.orderType === 'dinein' ? (
                <UtensilsCrossed size={16} color={colors.primary} />
              ) : (
                <ShoppingBag size={16} color={colors.accent} />
              )}
            </View>
            <View>
              <Text style={styles.orderNumber}>#{order.id}</Text>
              <Text style={styles.orderType}>
                {order.orderType === 'dinein' ? `Table ${order.tableNumber}` : `Pickup ${order.pickupTime}`}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <User size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.orderTime}>{getTimeSince(order.createdAt)}</Text>
          </View>
          {hasUnreadMessages && (
            <View style={styles.unreadBadge}>
              <MessageCircle size={14} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.orderItems}>
          {order.items.slice(0, 2).map((item, index) => (
            <Text key={item.id} style={styles.orderItemText} numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} more items</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
          <View style={styles.orderActions}>
            <Pressable 
              style={styles.chatButton}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenChat(order);
              }}
            >
              <MessageCircle size={18} color={colors.primary} />
            </Pressable>
            {order.status === 'pending' && (
              <>
                <Pressable 
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRejectOrder(order);
                  }}
                >
                  <X size={16} color="#fff" />
                </Pressable>
                <Pressable 
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAcceptOrder(order);
                  }}
                >
                  <Check size={16} color="#fff" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'dinein', 'pickup'] as const).map((type) => (
          <Pressable
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
              {type === 'all' ? 'All' : type === 'dinein' ? 'Dine-in' : 'Pickup'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabChange(tab.key, index)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
        <Animated.View
          style={[
            styles.tabIndicator,
            { transform: [{ translateX: tabIndicator }] },
          ]}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={getFilteredOrders()}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'new' ? 'No new orders at the moment' : 
               activeTab === 'active' ? 'No active orders' : 
               'No order history'}
            </Text>
          </View>
        }
      />

      <Modal visible={showOrderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order #{selectedOrder.id}</Text>
                  <Pressable onPress={() => setShowOrderModal(false)}>
                    <X size={24} color={colors.text} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.orderDetailSection}>
                    <View style={styles.orderDetailHeader}>
                      <View style={[styles.orderTypeIcon, { backgroundColor: selectedOrder.orderType === 'dinein' ? colors.primaryLight : colors.accentLight }]}>
                        {selectedOrder.orderType === 'dinein' ? (
                          <UtensilsCrossed size={20} color={colors.primary} />
                        ) : (
                          <ShoppingBag size={20} color={colors.accent} />
                        )}
                      </View>
                      <View style={styles.orderDetailHeaderInfo}>
                        <Text style={styles.orderDetailType}>
                          {selectedOrder.orderType === 'dinein' ? 'Dine-in' : 'Pickup'}
                        </Text>
                        <Text style={styles.orderDetailMeta}>
                          {selectedOrder.orderType === 'dinein' 
                            ? `Table ${selectedOrder.tableNumber}` 
                            : `Pickup at ${selectedOrder.pickupTime}`}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig[selectedOrder.status].bgColor }]}>
                        <Text style={[styles.statusText, { color: statusConfig[selectedOrder.status].color }]}>
                          {statusConfig[selectedOrder.status].label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.customerSection}>
                    <View style={styles.customerAvatarLarge}>
                      <User size={24} color={colors.textSecondary} />
                    </View>
                    <View style={styles.customerSectionInfo}>
                      <Text style={styles.customerSectionName}>{selectedOrder.customerName}</Text>
                      <Text style={styles.customerSectionPhone}>{selectedOrder.customerPhone}</Text>
                    </View>
                    <Pressable style={styles.callBtn}>
                      <Phone size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable 
                      style={styles.messageBtn}
                      onPress={() => {
                        setShowOrderModal(false);
                        handleOpenChat(selectedOrder);
                      }}
                    >
                      <MessageCircle size={18} color={colors.primary} />
                    </Pressable>
                  </View>

                  <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {selectedOrder.items.map((item) => (
                      <View key={item.id} style={styles.orderItemRow}>
                        <View style={styles.itemQuantity}>
                          <Text style={styles.itemQuantityText}>{item.quantity}x</Text>
                        </View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>${(item.quantity * item.price).toFixed(2)}</Text>
                      </View>
                    ))}
                    {selectedOrder.specialInstructions && (
                      <View style={styles.instructionsBox}>
                        <Text style={styles.instructionsLabel}>Special Instructions</Text>
                        <Text style={styles.instructionsText}>{selectedOrder.specialInstructions}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>${selectedOrder.subtotal.toFixed(2)}</Text>
                    </View>
                    {selectedOrder.discount > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Discount</Text>
                        <Text style={[styles.totalValue, { color: colors.success }]}>-${selectedOrder.discount.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                      <Text style={styles.totalLabelFinal}>Total</Text>
                      <Text style={styles.totalValueFinal}>${selectedOrder.total.toFixed(2)}</Text>
                    </View>
                  </View>

                  {selectedOrder.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <Pressable 
                        style={styles.rejectButton}
                        onPress={() => handleRejectOrder(selectedOrder)}
                      >
                        <X size={20} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Reject</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptOrder(selectedOrder)}
                      >
                        <Check size={20} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>Accept Order</Text>
                      </Pressable>
                    </View>
                  )}

                  {selectedOrder.status === 'accepted' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'preparing')}
                    >
                      <ChefHat size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Start Preparing</Text>
                    </Pressable>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'ready')}
                    >
                      <Package size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Mark as Ready</Text>
                    </Pressable>
                  )}

                  {selectedOrder.status === 'ready' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'completed')}
                    >
                      <CircleCheck size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Complete Order</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showChatModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatModalOverlay}
        >
          <View style={[styles.chatModalContent, { paddingBottom: insets.bottom }]}>
            {chatOrder && (
              <>
                <View style={styles.chatHeader}>
                  <Pressable onPress={() => setShowChatModal(false)}>
                    <ChevronLeft size={24} color={colors.text} />
                  </Pressable>
                  <View style={styles.chatHeaderInfo}>
                    <Text style={styles.chatHeaderName}>{chatOrder.customerName}</Text>
                    <Text style={styles.chatHeaderOrder}>Order #{chatOrder.id}</Text>
                  </View>
                  <View style={{ width: 24 }} />
                </View>

                <FlatList
                  data={chatOrder.messages}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.chatMessages}
                  renderItem={({ item: message }) => (
                    <View style={[
                      styles.messageBubble,
                      message.senderType === 'restaurant' ? styles.sentBubble : styles.receivedBubble
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.senderType === 'restaurant' && styles.sentMessageText
                      ]}>
                        {message.message}
                      </Text>
                      <Text style={[
                        styles.messageTime,
                        message.senderType === 'restaurant' && styles.sentMessageTime
                      ]}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyChatState}>
                      <MessageCircle size={40} color={colors.textMuted} />
                      <Text style={styles.emptyChatText}>No messages yet</Text>
                      <Text style={styles.emptyChatSubtext}>Start the conversation</Text>
                    </View>
                  }
                />

                <View style={styles.chatInputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                  />
                  <Pressable 
                    style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={20} color={newMessage.trim() ? '#fff' : colors.textMuted} />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: (width - 40) / 3,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  orderType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerDetails: {
    flex: 1,
    marginLeft: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  unreadBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: colors.error,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
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
    maxHeight: '90%',
    padding: 20,
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
  orderDetailSection: {
    marginBottom: 20,
  },
  orderDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderDetailType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  orderDetailMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  customerAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerSectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerSectionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  customerSectionPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemQuantity: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemQuantityText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  instructionsBox: {
    backgroundColor: colors.warningLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.warning,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.text,
  },
  totalSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRowFinal: {
    marginBottom: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.errorLight,
    gap: 8,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.success,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  chatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatModalContent: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  chatHeaderOrder: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chatMessages: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  receivedBubble: {
    backgroundColor: colors.backgroundSecondary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  sentBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyChatState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyChatSubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
});
