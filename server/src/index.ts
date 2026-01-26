import { Hono } from 'hono';
import { trpcServer } from '@trpc/server/adapters/hono';
import { appRouter } from './root'; // Your merged routers
import { createContext } from './create-context';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger'; // Built-in middleware

const app = new Hono();

// Global Middleware
app.use('*', logger()); // Logs all requests
app.use('*', cors({ origin: '*' })); // Adjust for production

// tRPC Endpoint
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

// Custom Middleware Endpoints (e.g., Stripe Webhook)
app.post('/webhook/stripe', async (c) => {
  // Handle Stripe webhook logic here
  const sig = c.req.header('stripe-signature');
  // Verify and update DB via Supabase
  return c.text('OK');
});

// Health Check
app.get('/health', (c) => c.text('OK'));

const port = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${port}`);
export default app; // For Vercel
