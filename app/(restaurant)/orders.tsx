import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Filter,
  Truck,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'customer' | 'restaurant';
  message: string;
  timestamp: string;
  read: boolean;
}

interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dinein' | 'pickup';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected' | 'cancelled';
  tableNumber?: string;
  pickupTime?: string;
  specialInstructions?: string;
  notes?: string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  messages: OrderMessage[];
}

type TabType = 'new' | 'active' | 'history';
type OrderStatus = Order['status'];

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dinein' | 'pickup'>('all');

  const tabIndicator = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const restaurantId = user?.restaurantId || 'restaurant-123';

  // Fetch restaurant orders
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: () => api.getRestaurantOrders(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
    },
    onError: (error: any) => {
      Alert.alert('Update Failed', error.message || 'Failed to update order status');
    },
  });

  const orders = ordersData?.data || [];

  // Real-time subscription for new orders
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`restaurant-orders:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
          
          // Show notification for new orders
          if (payload.eventType === 'INSERT') {
            Alert.alert('New Order!', 'You have a new order', [
              { text: 'View', onPress: () => refetch() },
              { text: 'OK' },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, refetch]);

  // Set initial filter from URL params
  useEffect(() => {
    if (urlFilter) {
      if (urlFilter === 'pending') setActiveTab('new');
      else if (['preparing', 'ready'].includes(urlFilter)) setActiveTab('active');
    }
  }, [urlFilter]);

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
    updateStatusMutation.mutate(
      { orderId: order.id, status: 'accepted' },
      {
        onSuccess: () => {
          setShowOrderModal(false);
          Alert.alert('Order Accepted', `Order #${order.id.slice(0, 8)} has been accepted`);
        },
      }
    );
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
            updateStatusMutation.mutate(
              { orderId: order.id, status: 'rejected' },
              {
                onSuccess: () => {
                  setShowOrderModal(false);
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    updateStatusMutation.mutate(
      { orderId: order.id, status: newStatus },
      {
        onSuccess: () => {
          setShowOrderModal(false);
        },
      }
    );
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

    // TODO: Send message via API
    // For now, update locally
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

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'completed',
      completed: null,
      rejected: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const styles = createStyles(colors, isDark);

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    const status = statusConfig[order.status];
    const StatusIcon = status.icon;
    const hasUnreadMessages = order.messages?.some(m => !m.read && m.senderType === 'customer') || false;

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
              <Text style={styles.orderNumber}>#{order.id.slice(0, 8)}</Text>
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

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Load Orders</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
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
                  <Text style={styles.modalTitle}>Order #{selectedOrder.id.slice(0, 8)}</Text>
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
                    {(selectedOrder.specialInstructions || selectedOrder.notes) && (
                      <View style={styles.instructionsBox}>
                        <Text style={styles.instructionsLabel}>Special Instructions</Text>
                        <Text style={styles.instructionsText}>
                          {selectedOrder.specialInstructions || selectedOrder.notes}
                        </Text>
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
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <>
                            <X size={20} color={colors.error} />
                            <Text style={[styles.actionButtonText, { color: colors.error }]}>Reject</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptOrder(selectedOrder)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Check size={20} color="#fff" />
                            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Accept Order</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}

                  {selectedOrder.status === 'accepted' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'preparing')}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <ChefHat size={20} color="#fff" />
                          <Text style={styles.primaryButtonText}>Start Preparing</Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'ready')}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Package size={20} color="#fff" />
                          <Text style={styles.primaryButtonText}>Mark as Ready</Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {selectedOrder.status === 'ready' && (
                    <Pressable 
                      style={styles.primaryButton}
                      onPress={() => handleUpdateStatus(selectedOrder, 'completed')}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <CircleCheck size={20} color="#fff" />
                          <Text style={styles.primaryButtonText}>Complete Order</Text>
                        </>
                      )}
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
                    <Text style={styles.chatHeaderOrder}>Order #{chatOrder.id.slice(0, 8)}</Text>
                  </View>
                  <View style={{ width: 24 }} />
                </View>

                <FlatList
                  data={chatOrder.messages || []}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
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
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
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
