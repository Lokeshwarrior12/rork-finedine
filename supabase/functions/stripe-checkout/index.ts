import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// // ── Stripe minimal SDK (no npm in Deno edge) ──
const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_BASE   = "https://api.stripe.com/v1";
async function stripePost(path: string, body: Record<string,string>) {
  const params = new URLSearchParams(body);
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  return res.json();
}
serve(async (req: Request) => {
  // CORS
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
   const { action, amount, orderId, currency } = await req.json();
//     // ── auth check (service-role client reads the JWT) ──
    const supabase = createClient(
     Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers });
    const { data: { user } } = await supabase.auth.setSession({ access_token: authHeader.split(" ")[1], refresh_token: "" });
    switch (action) {
      case "create_payment_intent": {
        const intent = await stripePost("/payment_intents", {
          amount:   String(Math.round(amount * 100)),   // cents
          currency: currency ?? "usd",
          metadata: JSON.stringify({ orderId, userId: user?.id }),
        });
        return new Response(JSON.stringify(intent), { headers });
      }
      case "refund": {
       const refund = await stripePost("/refunds", { payment_intent: orderId });
        return new Response(JSON.stringify(refund), { headers });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers });
  }
 })
