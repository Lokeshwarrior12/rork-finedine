// supabase/functions/create-payment-intent/index.ts

import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { amount } = await req.json();

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
  });

  return new Response(
    JSON.stringify({ clientSecret: intent.client_secret }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
