import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FCM_KEY = Deno.env.get("FIREBASE_SERVER_KEY")!;
serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const { fcmToken, title, body, data } = await req.json();
    if (!fcmToken) return new Response(JSON.stringify({ error: "Missing fcmToken" }), { status: 400, headers });
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${FCM_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        to:           fcmToken,
        notification: { title, body },
        data:         data ?? {},
      }),
    });
    const json = await res.json();
    return new Response(JSON.stringify(json), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers });
 }
})
