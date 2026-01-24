const getConfig = () => {
  const endpoint = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
  const namespace = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
  const token = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

  if (!endpoint || !namespace || !token) {
    console.error('Missing database configuration');
    throw new Error('Database configuration missing');
  }

  return { endpoint, namespace, token };
};

class SurrealHTTPClient {
  private endpoint: string;
  private namespace: string;
  private database: string;
  private token: string;

  constructor() {
    const config = getConfig();
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.namespace = config.namespace;
    this.database = 'finedine';
    this.token = config.token;
  }

  private async request<T>(sql: string, vars?: Record<string, unknown>): Promise<T[]> {
    try {
      const url = `${this.endpoint}/sql`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'NS': this.namespace,
          'DB': this.database,
        },
        body: vars ? JSON.stringify({ sql, vars }) : sql,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Database request failed:', response.status, errorText);
        throw new Error(`Database request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const results: T[] = [];
        for (const item of data) {
          if (item.result) {
            if (Array.isArray(item.result)) {
              results.push(...item.result);
            } else {
              results.push(item.result);
            }
          }
        }
        return results;
      }
      
      return data.result || [];
    } catch (error) {
      console.error('Database request error:', error);
      throw error;
    }
  }

  async query<T = unknown>(sql: string, vars?: Record<string, unknown>): Promise<T[][]> {
    const results = await this.request<T>(sql, vars);
    return [results];
  }

  async select<T = unknown>(thing: string): Promise<T | T[]> {
    const results = await this.request<T>(`SELECT * FROM ${thing}`);
    if (thing.includes(':')) {
      return results[0] || null as T;
    }
    return results;
  }

  async create<T = unknown>(thing: string, data: Record<string, unknown>): Promise<T> {
    const cleanData = { ...data };
    delete cleanData.id;
    
    const fields = Object.keys(cleanData);
    const values = fields.map(f => `${f} = $${f}`).join(', ');
    const sql = `CREATE ${thing} SET ${values}`;
    
    const results = await this.request<T>(sql, cleanData);
    return results[0];
  }

  async merge<T = unknown>(thing: string, data: Record<string, unknown>): Promise<T | null> {
    const cleanData = { ...data };
    delete cleanData.id;
    
    const fields = Object.keys(cleanData);
    if (fields.length === 0) return null;
    
    const values = fields.map(f => `${f} = $${f}`).join(', ');
    const sql = `UPDATE ${thing} SET ${values}`;
    
    const results = await this.request<T>(sql, cleanData);
    return results[0] || null;
  }

  async delete(thing: string): Promise<void> {
    await this.request(`DELETE ${thing}`);
  }
}

let client: SurrealHTTPClient | null = null;

export async function getDB(): Promise<SurrealHTTPClient> {
  if (!client) {
    client = new SurrealHTTPClient();
    console.log('Database client initialized');
  }
  return client;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDB();

  const schemas = [
    `DEFINE TABLE IF NOT EXISTS users SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS name ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS email ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS phone ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS address ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS photo ON users TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS role ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS points ON users TYPE int DEFAULT 0;
     DEFINE FIELD IF NOT EXISTS favorites ON users TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS cardDetails ON users TYPE option<object>;
     DEFINE FIELD IF NOT EXISTS restaurantId ON users TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS cuisinePreferences ON users TYPE option<array>;
     DEFINE FIELD IF NOT EXISTS passwordHash ON users TYPE string;
     DEFINE FIELD IF NOT EXISTS createdAt ON users TYPE datetime DEFAULT time::now();
     DEFINE FIELD IF NOT EXISTS updatedAt ON users TYPE datetime DEFAULT time::now();
     DEFINE INDEX IF NOT EXISTS userEmailIndex ON users FIELDS email UNIQUE;`,

    `DEFINE TABLE IF NOT EXISTS restaurants SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS name ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS description ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS cuisineType ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS address ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS city ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS phone ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS email ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS rating ON restaurants TYPE float DEFAULT 0;
     DEFINE FIELD IF NOT EXISTS reviewCount ON restaurants TYPE int DEFAULT 0;
     DEFINE FIELD IF NOT EXISTS logo ON restaurants TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS images ON restaurants TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS openingHours ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS waitingTime ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS categories ON restaurants TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS acceptsTableBooking ON restaurants TYPE bool DEFAULT false;
     DEFINE FIELD IF NOT EXISTS bookingTerms ON restaurants TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS ownerId ON restaurants TYPE string;
     DEFINE FIELD IF NOT EXISTS tables ON restaurants TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS createdAt ON restaurants TYPE datetime DEFAULT time::now();
     DEFINE FIELD IF NOT EXISTS updatedAt ON restaurants TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS deals SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantName ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantImage ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS title ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS description ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS discountPercent ON deals TYPE int;
     DEFINE FIELD IF NOT EXISTS offerType ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS maxCoupons ON deals TYPE int;
     DEFINE FIELD IF NOT EXISTS claimedCoupons ON deals TYPE int DEFAULT 0;
     DEFINE FIELD IF NOT EXISTS minOrder ON deals TYPE float;
     DEFINE FIELD IF NOT EXISTS validTill ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS daysAvailable ON deals TYPE array;
     DEFINE FIELD IF NOT EXISTS startTime ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS endTime ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS isActive ON deals TYPE bool DEFAULT true;
     DEFINE FIELD IF NOT EXISTS termsConditions ON deals TYPE string;
     DEFINE FIELD IF NOT EXISTS createdAt ON deals TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS coupons SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS dealId ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS userId ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS dealTitle ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantName ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantImage ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS discountPercent ON coupons TYPE int;
     DEFINE FIELD IF NOT EXISTS status ON coupons TYPE string DEFAULT 'active';
     DEFINE FIELD IF NOT EXISTS claimedAt ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS usedAt ON coupons TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS expiresAt ON coupons TYPE string;
     DEFINE FIELD IF NOT EXISTS code ON coupons TYPE string;
     DEFINE INDEX IF NOT EXISTS couponCodeIndex ON coupons FIELDS code UNIQUE;`,

    `DEFINE TABLE IF NOT EXISTS services SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON services TYPE string;
     DEFINE FIELD IF NOT EXISTS name ON services TYPE string;
     DEFINE FIELD IF NOT EXISTS pricePerPerson ON services TYPE float;
     DEFINE FIELD IF NOT EXISTS minGuests ON services TYPE int;
     DEFINE FIELD IF NOT EXISTS maxGuests ON services TYPE int;
     DEFINE FIELD IF NOT EXISTS isActive ON services TYPE bool DEFAULT true;
     DEFINE FIELD IF NOT EXISTS description ON services TYPE option<string>;`,

    `DEFINE TABLE IF NOT EXISTS bookingSlots SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON bookingSlots TYPE string;
     DEFINE FIELD IF NOT EXISTS name ON bookingSlots TYPE string;
     DEFINE FIELD IF NOT EXISTS startTime ON bookingSlots TYPE string;
     DEFINE FIELD IF NOT EXISTS endTime ON bookingSlots TYPE string;
     DEFINE FIELD IF NOT EXISTS maxGuests ON bookingSlots TYPE int;`,

    `DEFINE TABLE IF NOT EXISTS tableBookings SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS userId ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS customerName ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS customerPhone ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS date ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS time ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS guests ON tableBookings TYPE int;
     DEFINE FIELD IF NOT EXISTS tableType ON tableBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS tableNumber ON tableBookings TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS specialRequests ON tableBookings TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS status ON tableBookings TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS createdAt ON tableBookings TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS serviceBookings SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS serviceId ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS serviceName ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantId ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS userId ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS date ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS timeSlot ON serviceBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS guests ON serviceBookings TYPE int;
     DEFINE FIELD IF NOT EXISTS totalPrice ON serviceBookings TYPE float;
     DEFINE FIELD IF NOT EXISTS status ON serviceBookings TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS createdAt ON serviceBookings TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS notifications SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS userId ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantId ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS restaurantName ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS title ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS message ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS type ON notifications TYPE string;
     DEFINE FIELD IF NOT EXISTS read ON notifications TYPE bool DEFAULT false;
     DEFINE FIELD IF NOT EXISTS createdAt ON notifications TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS orders SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON orders TYPE string;
     DEFINE FIELD IF NOT EXISTS customerId ON orders TYPE string;
     DEFINE FIELD IF NOT EXISTS customerName ON orders TYPE string;
     DEFINE FIELD IF NOT EXISTS customerPhone ON orders TYPE string;
     DEFINE FIELD IF NOT EXISTS customerPhoto ON orders TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS orderType ON orders TYPE string;
     DEFINE FIELD IF NOT EXISTS items ON orders TYPE array;
     DEFINE FIELD IF NOT EXISTS subtotal ON orders TYPE float;
     DEFINE FIELD IF NOT EXISTS discount ON orders TYPE float DEFAULT 0;
     DEFINE FIELD IF NOT EXISTS total ON orders TYPE float;
     DEFINE FIELD IF NOT EXISTS status ON orders TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS tableNumber ON orders TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS pickupTime ON orders TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS specialInstructions ON orders TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS estimatedTime ON orders TYPE option<int>;
     DEFINE FIELD IF NOT EXISTS messages ON orders TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS createdAt ON orders TYPE datetime DEFAULT time::now();
     DEFINE FIELD IF NOT EXISTS updatedAt ON orders TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS menuItems SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON menuItems TYPE string;
     DEFINE FIELD IF NOT EXISTS name ON menuItems TYPE string;
     DEFINE FIELD IF NOT EXISTS description ON menuItems TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS price ON menuItems TYPE float;
     DEFINE FIELD IF NOT EXISTS category ON menuItems TYPE string;
     DEFINE FIELD IF NOT EXISTS image ON menuItems TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS isAvailable ON menuItems TYPE bool DEFAULT true;
     DEFINE FIELD IF NOT EXISTS isVegetarian ON menuItems TYPE bool DEFAULT false;
     DEFINE FIELD IF NOT EXISTS isVegan ON menuItems TYPE bool DEFAULT false;
     DEFINE FIELD IF NOT EXISTS isGlutenFree ON menuItems TYPE bool DEFAULT false;
     DEFINE FIELD IF NOT EXISTS spiceLevel ON menuItems TYPE option<int>;
     DEFINE FIELD IF NOT EXISTS preparationTime ON menuItems TYPE option<int>;
     DEFINE FIELD IF NOT EXISTS createdAt ON menuItems TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS inventory SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON inventory TYPE string;
     DEFINE FIELD IF NOT EXISTS name ON inventory TYPE string;
     DEFINE FIELD IF NOT EXISTS category ON inventory TYPE string;
     DEFINE FIELD IF NOT EXISTS quantity ON inventory TYPE float;
     DEFINE FIELD IF NOT EXISTS unit ON inventory TYPE string;
     DEFINE FIELD IF NOT EXISTS minStock ON inventory TYPE float;
     DEFINE FIELD IF NOT EXISTS costPerUnit ON inventory TYPE float;
     DEFINE FIELD IF NOT EXISTS supplier ON inventory TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS expiryDate ON inventory TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS lastRestocked ON inventory TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS createdAt ON inventory TYPE datetime DEFAULT time::now();
     DEFINE FIELD IF NOT EXISTS updatedAt ON inventory TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS foodWaste SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS itemName ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS category ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS quantity ON foodWaste TYPE float;
     DEFINE FIELD IF NOT EXISTS unit ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS reason ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS costPerUnit ON foodWaste TYPE float;
     DEFINE FIELD IF NOT EXISTS totalCost ON foodWaste TYPE float;
     DEFINE FIELD IF NOT EXISTS date ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS time ON foodWaste TYPE string;
     DEFINE FIELD IF NOT EXISTS recordedBy ON foodWaste TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS notes ON foodWaste TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS inventoryItemId ON foodWaste TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS createdAt ON foodWaste TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS transactions SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON transactions TYPE string;
     DEFINE FIELD IF NOT EXISTS customerId ON transactions TYPE string;
     DEFINE FIELD IF NOT EXISTS customerName ON transactions TYPE string;
     DEFINE FIELD IF NOT EXISTS couponId ON transactions TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS couponCode ON transactions TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS originalAmount ON transactions TYPE float;
     DEFINE FIELD IF NOT EXISTS discountAmount ON transactions TYPE float;
     DEFINE FIELD IF NOT EXISTS finalAmount ON transactions TYPE float;
     DEFINE FIELD IF NOT EXISTS paymentMethod ON transactions TYPE string;
     DEFINE FIELD IF NOT EXISTS status ON transactions TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS createdAt ON transactions TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS schedules SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON schedules TYPE string;
     DEFINE FIELD IF NOT EXISTS weekStartDate ON schedules TYPE string;
     DEFINE FIELD IF NOT EXISTS weekEndDate ON schedules TYPE string;
     DEFINE FIELD IF NOT EXISTS shifts ON schedules TYPE array DEFAULT [];
     DEFINE FIELD IF NOT EXISTS createdAt ON schedules TYPE datetime DEFAULT time::now();
     DEFINE FIELD IF NOT EXISTS updatedAt ON schedules TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS employees SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantId ON employees TYPE string;
     DEFINE FIELD IF NOT EXISTS name ON employees TYPE string;
     DEFINE FIELD IF NOT EXISTS phone ON employees TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS email ON employees TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS role ON employees TYPE string;
     DEFINE FIELD IF NOT EXISTS availability ON employees TYPE object;
     DEFINE FIELD IF NOT EXISTS hourlyRate ON employees TYPE option<float>;
     DEFINE FIELD IF NOT EXISTS createdAt ON employees TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS verificationCodes SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS email ON verificationCodes TYPE string;
     DEFINE FIELD IF NOT EXISTS code ON verificationCodes TYPE string;
     DEFINE FIELD IF NOT EXISTS expiresAt ON verificationCodes TYPE datetime;
     DEFINE FIELD IF NOT EXISTS createdAt ON verificationCodes TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS payments SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS userId ON payments TYPE string;
     DEFINE FIELD IF NOT EXISTS amount ON payments TYPE float;
     DEFINE FIELD IF NOT EXISTS currency ON payments TYPE string;
     DEFINE FIELD IF NOT EXISTS type ON payments TYPE string;
     DEFINE FIELD IF NOT EXISTS status ON payments TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS stripePaymentIntentId ON payments TYPE option<string>;
     DEFINE FIELD IF NOT EXISTS metadata ON payments TYPE option<object>;
     DEFINE FIELD IF NOT EXISTS createdAt ON payments TYPE datetime DEFAULT time::now();`,

    `DEFINE TABLE IF NOT EXISTS callBookings SCHEMAFULL;
     DEFINE FIELD IF NOT EXISTS restaurantName ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS ownerName ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS email ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS phone ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS preferredDate ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS preferredTime ON callBookings TYPE string;
     DEFINE FIELD IF NOT EXISTS status ON callBookings TYPE string DEFAULT 'pending';
     DEFINE FIELD IF NOT EXISTS createdAt ON callBookings TYPE datetime DEFAULT time::now();`,
  ];

  for (const schema of schemas) {
    try {
      await database.query(schema);
    } catch (error) {
      console.error('Error creating schema:', error);
    }
  }

  console.log('Database schemas initialized');
}

export function extractId(record: { id: string | { id: string } }): string {
  if (typeof record.id === 'object' && record.id !== null) {
    return record.id.id || String(record.id);
  }
  const idStr = String(record.id);
  if (idStr.includes(':')) {
    return idStr.split(':')[1];
  }
  return idStr;
}
