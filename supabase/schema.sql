create extension if not exists pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE,
  phone text,
  address text,
  role text,
  cuisine_preferences text[],
  restaurant_id uuid,
  photo text,
  password_hash text,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  owner_id uuid,
  tables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  restaurant_id uuid REFERENCES restaurants(id),
  order_type text,
  items jsonb NOT NULL,
  subtotal numeric,
  discount numeric DEFAULT 0,
  total numeric,
  status text DEFAULT 'pending',
  table_number text,
  pickup_time text,
  special_instructions text,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  user_id uuid REFERENCES users(id),
  type text,
  date timestamptz,
  time text,
  guests integer,
  status text DEFAULT 'pending',
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  type text,
  status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  restaurant_id uuid,
  title text,
  message text,
  type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  code text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_waste (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  item_name text,
  category text,
  quantity numeric,
  unit text,
  reason text,
  cost_per_unit numeric,
  total_cost numeric,
  date timestamptz DEFAULT now(),
  notes text,
  inventory_item_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  name text,
  category text,
  quantity numeric,
  unit text,
  min_stock numeric,
  cost_per_unit numeric,
  supplier text,
  expiry_date date,
  last_restocked timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  restaurant_name text,
  restaurant_image text,
  title text,
  description text,
  discount_percent integer,
  offer_type text,
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

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid,
  user_id uuid,
  deal_title text,
  restaurant_name text,
  restaurant_image text,
  discount_percent integer,
  status text DEFAULT 'active',
  claimed_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz,
  code text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  customer_id uuid,
  customer_name text,
  coupon_id uuid,
  coupon_code text,
  original_amount numeric,
  discount_amount numeric,
  final_amount numeric,
  payment_method text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants (city);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
