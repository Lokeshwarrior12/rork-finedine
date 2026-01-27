Use Gin groups: /public (no auth), /user, /owner.
Example: GET /restaurants → query Supabase + Redis cache.
POST /orders → insert to DB, trigger FCM queue.
