-- ============================================
-- FINEDINE COMPLETE DATABASE SCHEMA
-- ============================================

create extension if not exists pgcrypto;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE,
  phone text,
  address text,
  role text CHECK (role IN ('customer', 'restaurant_owner')),
  cuisine_preferences text[],
  restaurant_id uuid,
  photo text,
  password_hash text,
  points integer DEFAULT 0,
  favorites text[] DEFAULT '{}',
  card_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. RESTAURANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cuisine_type text,
  address text,
  city text,
  phone text,
  email text,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  logo text,
  images text[],
  opening_hours text,
  waiting_time text,
  categories text[],
  accepts_table_booking boolean DEFAULT false,
  booking_terms text,
  owner_id uuid REFERENCES users(id),
  tables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text,
  image text,
  is_available boolean DEFAULT true,
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  spice_level integer,
  preparation_time integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  restaurant_id uuid REFERENCES restaurants(id),
  customer_id text,
  customer_name text,
  customer_phone text,
  customer_photo text,
  order_type text CHECK (order_type IN ('dinein', 'pickup')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric,
  discount numeric DEFAULT 0,
  total numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled')),
  table_number text,
  pickup_time text,
  special_instructions text,
  estimated_time integer,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. BOOKINGS TABLE (Table & Service Bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  user_id uuid REFERENCES users(id),
  type text CHECK (type IN ('table', 'service')),
  date text,
  time text,
  guests integer,
  table_type text,
  table_number text,
  special_requests text,
  service_id text,
  service_name text,
  time_slot text,
  total_price numeric,
  customer_name text,
  customer_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 6. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_per_person numeric NOT NULL,
  min_guests integer DEFAULT 1,
  max_guests integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. BOOKING SLOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  max_guests integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 8. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  restaurant_id uuid,
  restaurant_name text,
  title text,
  message text,
  type text CHECK (type IN ('offer', 'booking', 'general', 'low_stock')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 10. VERIFICATION CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  code text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 11. DEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  restaurant_name text,
  restaurant_image text,
  title text NOT NULL,
  description text,
  discount_percent integer CHECK (discount_percent >= 0 AND discount_percent <= 100),
  offer_type text CHECK (offer_type IN ('dinein', 'pickup', 'both')),
  max_coupons integer,
  claimed_coupons integer DEFAULT 0,
  min_order numeric,
  valid_till text,
  days_available text[],
  start_time text,
  end_time text,
  is_active boolean DEFAULT true,
  terms_conditions text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 12. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals(id),
  user_id uuid REFERENCES users(id),
  deal_title text,
  restaurant_name text,
  restaurant_image text,
  discount_percent integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  claimed_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz,
  code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 13. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  customer_id uuid,
  customer_name text,
  coupon_id uuid REFERENCES coupons(id),
  coupon_code text,
  original_amount numeric,
  discount_amount numeric,
  final_amount numeric,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'upi')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 14. INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity numeric DEFAULT 0,
  unit text,
  min_stock numeric DEFAULT 10,
  cost_per_unit numeric DEFAULT 0,
  supplier text,
  expiry_date date,
  last_restocked timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 15. FOOD WASTE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS food_waste (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  quantity numeric NOT NULL,
  unit text,
  reason text CHECK (reason IN ('expired', 'spoiled', 'overproduction', 'customer_return', 'preparation_error', 'other')),
  cost_per_unit numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  date text,
  time text,
  recorded_by text,
  notes text,
  inventory_item_id uuid REFERENCES inventory(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 16. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  role text NOT NULL,
  availability jsonb DEFAULT '{}'::jsonb,
  hourly_rate numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 17. SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  week_start_date text NOT NULL,
  week_end_date text NOT NULL,
  shifts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 18. CALL BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text,
  owner_name text,
  email text,
  phone text,
  preferred_date text,
  preferred_time text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant ON bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);
CREATE INDEX IF NOT EXISTS idx_services_restaurant ON services(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_deals_restaurant ON deals(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_food_waste_restaurant ON food_waste(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_food_waste_date ON food_waste(date);
CREATE INDEX IF NOT EXISTS idx_employees_restaurant ON employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_restaurant ON schedules(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['users', 'restaurants', 'menu_items', 'orders', 'bookings', 'services', 'booking_slots', 'inventory', 'food_waste', 'employees', 'schedules'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire coupons function
CREATE OR REPLACE FUNCTION expire_old_coupons()
RETURNS void AS $$
BEGIN
    UPDATE coupons
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================
-- Enable RLS on sensitive tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
