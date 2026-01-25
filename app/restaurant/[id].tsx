import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Star,
  Clock,
  Phone,
  MapPin,
  Navigation,
  Calendar,
  Users,
  X,
  ChevronRight,
  Ticket,
  CheckCircle,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { restaurants, deals, services } from '@/mocks/data';
import { Deal } from '@/types';

const { width } = Dimensions.get('window');

const ConfettiPiece = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const color = [Colors.primary, Colors.accent, Colors.success, '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 5)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 150,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, translateY, translateX, rotate, opacity]);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  );
};

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite, addPoints } = useAuth();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimingDealId, setClaimingDealId] = useState<string | null>(null);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [claimedDeal, setClaimedDeal] = useState<Deal | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageSliderRef = useRef<FlatList>(null);

  const restaurant = restaurants.find(r => r.id === id);
  const restaurantDeals = deals.filter(d => d.restaurantId === id && d.isActive);
  const restaurantServices = services.filter(s => s.restaurantId === id);

  const handleImageScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(slideIndex);
  }, []);

  const renderImageItem = useCallback(({ item }: { item: string }) => (
    <View style={styles.imageSlide}>
      <Image
        source={{ uri: item }}
        style={styles.heroImage}
        contentFit="cover"
      />
    </View>
  ), []);

  if (!restaurant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  const isFavorite = user?.favorites.includes(restaurant.id);

  const handleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(restaurant.id);
  };

  const handleBook = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBookingModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClaimCoupon = async (deal: Deal) => {
    if (claimingDealId) return;
    
    setClaimingDealId(deal.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(async () => {
      setClaimedDeal(deal);
      setShowConfetti(true);
      setShowClaimSuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const pointsEarned = Math.round(deal.discountPercent / 2);
      addPoints(pointsEarned);
      
      setClaimingDealId(null);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }, 500);
  };

  const timeSlots = ['12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00'];
  const dates = ['Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14'];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <FlatList
              ref={imageSliderRef}
              data={restaurant.images.length > 0 ? restaurant.images : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800']}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `image-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
              bounces={false}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageGradient}
              pointerEvents="none"
            />
            <View style={[styles.headerButtons, { top: insets.top + 10 }]}>
              <Pressable style={styles.headerButton} onPress={() => router.back()}>
                <ArrowLeft size={22} color={Colors.surface} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleFavorite}>
                <Heart 
                  size={22} 
                  color={isFavorite ? Colors.error : Colors.surface}
                  fill={isFavorite ? Colors.error : 'transparent'}
                />
              </Pressable>
            </View>
            {restaurant.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {restaurant.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      currentImageIndex === index && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.mainInfo}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={18} color={Colors.rating} fill={Colors.rating} />
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
                <Text style={styles.reviewCount}>({restaurant.reviewCount} reviews)</Text>
              </View>
              <Text style={styles.cuisineText}>{restaurant.cuisineType} Cuisine</Text>
              <Text style={styles.description}>{restaurant.description}</Text>
            </View>

            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <Clock size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Wait Time</Text>
                  <Text style={styles.infoValue}>{restaurant.waitingTime}</Text>
                </View>
              </View>
              <View style={styles.infoCard}>
                <MapPin size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{restaurant.city}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contactRow}>
              <Pressable style={styles.contactButton}>
                <Phone size={18} color={Colors.primary} />
                <Text style={styles.contactButtonText}>Call</Text>
              </Pressable>
              <Pressable style={styles.contactButton}>
                <Navigation size={18} color={Colors.primary} />
                <Text style={styles.contactButtonText}>Directions</Text>
              </Pressable>
            </View>

            {restaurantDeals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Deals</Text>
                {restaurantDeals.map((deal) => (
                  <View key={deal.id} style={styles.dealCard}>
                    <View style={styles.dealBadge}>
                      <Text style={styles.dealBadgeText}>{deal.discountPercent}% OFF</Text>
                    </View>
                    <View style={styles.dealContent}>
                      <Text style={styles.dealTitle}>{deal.title}</Text>
                      <Text style={styles.dealDescription} numberOfLines={2}>{deal.description}</Text>
                      <View style={styles.dealMeta}>
                        <Text style={styles.dealMetaText}>Until {deal.validTill}</Text>
                        <Text style={styles.dealMetaText}>{deal.claimedCoupons}/{deal.maxCoupons} claimed</Text>
                      </View>
                    </View>
                    <Pressable 
                      style={[styles.claimButton, claimingDealId === deal.id && styles.claimButtonDisabled]}
                      onPress={() => handleClaimCoupon(deal)}
                      disabled={claimingDealId === deal.id}
                    >
                      <Ticket size={16} color={Colors.surface} />
                      <Text style={styles.claimButtonText}>
                        {claimingDealId === deal.id ? 'Claiming...' : 'Claim'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {restaurantServices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {restaurantServices.map((service) => (
                  <Pressable key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.servicePrice}>${service.pricePerPerson}/person</Text>
                      <Text style={styles.serviceGuests}>{service.minGuests}-{service.maxGuests} guests</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.textLight} />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opening Hours</Text>
              <View style={styles.hoursCard}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.hoursText}>{restaurant.openingHours}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.addressCard}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.addressText}>{restaurant.address}, {restaurant.city}</Text>
              </View>
            </View>

            {restaurant.bookingTerms && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Booking Terms</Text>
                <Text style={styles.termsText}>{restaurant.bookingTerms}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {restaurant.acceptsTableBooking && (
          <View style={[styles.bookingBar, { paddingBottom: insets.bottom + 10 }]}>
            <View>
              <Text style={styles.bookingLabel}>Table Booking</Text>
              <Text style={styles.bookingSubtext}>Reserve your spot</Text>
            </View>
            <Pressable 
              style={styles.bookButton}
              onPress={() => setShowBookingModal(true)}
            >
              <Calendar size={18} color={Colors.surface} />
              <Text style={styles.bookButtonText}>Book a Table</Text>
            </Pressable>
          </View>
        )}

        <Modal visible={showBookingModal} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book a Table</Text>
              <Pressable onPress={() => setShowBookingModal(false)}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView 
              contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
            >
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dateRow}>
                    {dates.map((date) => (
                      <Pressable
                        key={date}
                        style={[styles.dateChip, selectedDate === date && styles.dateChipActive]}
                        onPress={() => setSelectedDate(date)}
                      >
                        <Text style={[styles.dateChipText, selectedDate === date && styles.dateChipTextActive]}>
                          {date}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Time</Text>
                <View style={styles.timeGrid}>
                  {timeSlots.map((time) => (
                    <Pressable
                      key={time}
                      style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.timeChipText, selectedTime === time && styles.timeChipTextActive]}>
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Number of Guests</Text>
                <View style={styles.guestSelector}>
                  <Pressable 
                    style={styles.guestButton}
                    onPress={() => setGuestCount(String(Math.max(1, Number(guestCount) - 1)))}
                  >
                    <Text style={styles.guestButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.guestDisplay}>
                    <Users size={18} color={Colors.primary} />
                    <Text style={styles.guestCount}>{guestCount}</Text>
                  </View>
                  <Pressable 
                    style={styles.guestButton}
                    onPress={() => setGuestCount(String(Number(guestCount) + 1))}
                  >
                    <Text style={styles.guestButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Special Requests (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any dietary requirements or special occasions?"
                  placeholderTextColor={Colors.textLight}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable style={styles.confirmButton} onPress={handleBook}>
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>

        {showSuccess && (
          <View style={[styles.successToast, { bottom: insets.bottom + 100 }]}>
            <CheckCircle size={20} color={Colors.success} />
            <Text style={styles.successText}>Booking confirmed!</Text>
          </View>
        )}

        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece 
                key={i} 
                delay={Math.random() * 300} 
                startX={Math.random() * width}
              />
            ))}
          </View>
        )}

        <Modal visible={showClaimSuccess} animationType="fade" transparent>
          <View style={styles.claimModalOverlay}>
            <View style={styles.claimModalContainer}>
              <View style={styles.claimSuccessIcon}>
                <Sparkles size={40} color={Colors.surface} />
              </View>
              <Text style={styles.claimSuccessTitle}>Coupon Claimed!</Text>
              {claimedDeal && (
                <>
                  <Text style={styles.claimSuccessDesc}>
                    {claimedDeal.discountPercent}% off at {claimedDeal.restaurantName}
                  </Text>
                  <View style={styles.pointsEarnedBadge}>
                    <Sparkles size={16} color={Colors.accent} />
                    <Text style={styles.pointsEarnedText}>
                      +{Math.round(claimedDeal.discountPercent / 2)} points earned!
                    </Text>
                  </View>
                </>
              )}
              <Text style={styles.claimSuccessNote}>
                Check your coupons to reveal the code.
              </Text>
              <Pressable 
                style={styles.claimSuccessButton}
                onPress={() => {
                  setShowClaimSuccess(false);
                  router.push('/(customer)/coupons');
                }}
              >
                <Text style={styles.claimSuccessButtonText}>View My Coupons</Text>
              </Pressable>
              <Pressable 
                style={styles.claimDismissButton}
                onPress={() => setShowClaimSuccess(false)}
              >
                <Text style={styles.claimDismissText}>Continue Browsing</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  imageSlide: {
    width: width,
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: Colors.surface,
    width: 24,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  mainInfo: {
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  cuisineText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  dealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  dealBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  dealContent: {
    marginBottom: 12,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  dealMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  dealMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  servicePrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  serviceGuests: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  hoursText: {
    fontSize: 15,
    color: Colors.text,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  addressText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bookingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bookingSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  dateChipTextActive: {
    color: Colors.surface,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    width: (width - 70) / 4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  timeChipTextActive: {
    color: Colors.surface,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  guestButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 24,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  guestDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestCount: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  successToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  claimButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  claimModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  claimModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  claimSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  claimSuccessTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  claimSuccessDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}20`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  pointsEarnedText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  claimSuccessNote: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  claimSuccessButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimSuccessButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  claimDismissButton: {
    paddingVertical: 10,
  },
  claimDismissText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
});
