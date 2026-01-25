// lib/payments.ts

export async function createPaymentIntent(amount: number) {
  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ amount }),
    }
  );

  if (!res.ok) throw new Error('Payment intent failed');
  return res.json();
}
