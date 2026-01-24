import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { restaurantsRouter } from "./routes/restaurants";
import { dealsRouter } from "./routes/deals";
import { couponsRouter } from "./routes/coupons";
import { bookingsRouter } from "./routes/bookings";
import { analyticsRouter } from "./routes/analytics";
import { notificationsRouter } from "./routes/notifications";
import { paymentsRouter } from "./routes/payments";
import { verificationRouter } from "./routes/verification";
import { transactionsRouter } from "./routes/transactions";
import { scheduleRouter } from "./routes/schedule";
import { salesAnalyticsRouter } from "./routes/sales-analytics";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  restaurants: restaurantsRouter,
  deals: dealsRouter,
  coupons: couponsRouter,
  bookings: bookingsRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
  payments: paymentsRouter,
  verification: verificationRouter,
  transactions: transactionsRouter,
  schedule: scheduleRouter,
  salesAnalytics: salesAnalyticsRouter,
});

export type AppRouter = typeof appRouter;
