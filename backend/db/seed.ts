import { db } from './index';
import { hashPassword } from '../auth/jwt';
import { User, Restaurant } from '@/types';

export async function seedSampleUsers() {
  console.log('Starting database seed...');

  try {
    const existingCustomer = await db.users.getByEmail('b14175705@gmail.com');
    if (!existingCustomer) {
      const customerPasswordHash = await hashPassword('Daddy@2502');
      const customerId = 'user_sample_customer';
      
      const customerUser: User & { passwordHash: string } = {
        id: customerId,
        name: 'Sample Customer',
        email: 'b14175705@gmail.com',
        phone: '+1234567890',
        address: '123 Main Street, City',
        role: 'customer',
        points: 500,
        favorites: [],
        cuisinePreferences: ['Indian', 'Thai', 'Italian'],
        passwordHash: customerPasswordHash,
      };

      await db.users.create(customerUser);
      console.log('Sample customer created: b14175705@gmail.com');
    } else {
      console.log('Sample customer already exists: b14175705@gmail.com');
    }

    const existingRestaurantOwner = await db.users.getByEmail('lokeshwarrior12@gmail.com');
    if (!existingRestaurantOwner) {
      const ownerPasswordHash = await hashPassword('Daddy@2502');
      const ownerId = 'user_sample_restaurant_owner';
      const restaurantId = 'rest_sample_restaurant';

      const ownerUser: User & { passwordHash: string } = {
        id: ownerId,
        name: 'Lokesh Restaurant Owner',
        email: 'lokeshwarrior12@gmail.com',
        phone: '+1987654321',
        address: '456 Restaurant Avenue, City',
        role: 'restaurant_owner',
        points: 0,
        favorites: [],
        restaurantId: restaurantId,
        passwordHash: ownerPasswordHash,
      };

      await db.users.create(ownerUser);
      console.log('Sample restaurant owner created: lokeshwarrior12@gmail.com');

      const existingRestaurant = await db.restaurants.getById(restaurantId);
      if (!existingRestaurant) {
        const sampleRestaurant: Restaurant = {
          id: restaurantId,
          name: 'Spice Garden',
          description: 'Authentic Indian cuisine with a modern twist. Experience the rich flavors of India in every bite.',
          cuisineType: 'Indian',
          address: '456 Restaurant Avenue',
          city: 'New York',
          phone: '+1987654321',
          email: 'lokeshwarrior12@gmail.com',
          rating: 4.5,
          reviewCount: 128,
          logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
          ],
          openingHours: '11:00 AM - 10:00 PM',
          waitingTime: '15-25 min',
          categories: ['Indian', 'Fine Dining', 'Family Friendly'],
          acceptsTableBooking: true,
          bookingTerms: 'Reservations must be made at least 2 hours in advance. Cancellations within 1 hour may incur a fee.',
          ownerId: ownerId,
        };

        await db.restaurants.create(sampleRestaurant);
        console.log('Sample restaurant created: Spice Garden');

        const menuItems = [
          {
            id: 'menu_1',
            restaurantId: restaurantId,
            name: 'Butter Chicken',
            description: 'Tender chicken in rich tomato-butter sauce',
            price: 16.99,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
            isAvailable: true,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            spiceLevel: 2,
            preparationTime: 20,
          },
          {
            id: 'menu_2',
            restaurantId: restaurantId,
            name: 'Paneer Tikka Masala',
            description: 'Grilled cottage cheese in spiced gravy',
            price: 14.99,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
            isAvailable: true,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            spiceLevel: 2,
            preparationTime: 18,
          },
          {
            id: 'menu_3',
            restaurantId: restaurantId,
            name: 'Biryani',
            description: 'Fragrant basmati rice with spices and meat',
            price: 18.99,
            category: 'Rice',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
            isAvailable: true,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            spiceLevel: 3,
            preparationTime: 25,
          },
          {
            id: 'menu_4',
            restaurantId: restaurantId,
            name: 'Samosa',
            description: 'Crispy pastry filled with spiced potatoes',
            price: 6.99,
            category: 'Appetizers',
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
            isAvailable: true,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: false,
            spiceLevel: 1,
            preparationTime: 10,
          },
          {
            id: 'menu_5',
            restaurantId: restaurantId,
            name: 'Naan Bread',
            description: 'Traditional Indian flatbread',
            price: 3.99,
            category: 'Breads',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
            isAvailable: true,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            spiceLevel: 0,
            preparationTime: 8,
          },
          {
            id: 'menu_6',
            restaurantId: restaurantId,
            name: 'Mango Lassi',
            description: 'Sweet yogurt drink with mango',
            price: 4.99,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',
            isAvailable: true,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            spiceLevel: 0,
            preparationTime: 5,
          },
        ];

        for (const item of menuItems) {
          await db.menuItems.create(item);
        }
        console.log('Sample menu items created');

        const deal = {
          id: 'deal_sample_1',
          restaurantId: restaurantId,
          restaurantName: 'Spice Garden',
          restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
          title: '20% Off on All Main Courses',
          description: 'Enjoy 20% discount on all main course items. Valid for dine-in and takeaway.',
          discountPercent: 20,
          offerType: 'both' as const,
          maxCoupons: 100,
          claimedCoupons: 25,
          minOrder: 30,
          validTill: '2026-03-31',
          daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          startTime: '11:00',
          endTime: '22:00',
          isActive: true,
          termsConditions: 'Cannot be combined with other offers. Minimum order $30.',
        };

        await db.deals.create(deal);
        console.log('Sample deal created');
      }
    } else {
      console.log('Sample restaurant owner already exists: lokeshwarrior12@gmail.com');
    }

    console.log('Database seed completed successfully!');
    return { success: true, message: 'Sample users seeded successfully' };
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}
