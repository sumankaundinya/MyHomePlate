import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Keywords that count as "interested" in Telugu and English
const INTEREST_KEYWORDS = [
  "ఆసక్తి", "ఆసక్తి ఉంది", "interested", "yes", "అవును", "ok", "okay",
  "haan", "ha", "han", "sure", "tell me more", "చెప్పండి",
];

function isInterested(text: string): boolean {
  const normalised = text.toLowerCase().trim();
  return INTEREST_KEYWORDS.some((kw) => normalised.includes(kw.toLowerCase()));
}

function normalisePhone(raw: string): { withPlus: string; withoutPlus: string } {
  let digits = raw.replace(/\D/g, "");
  if (!digits.startsWith("91")) {
    digits = "91" + digits.slice(-10);
  }
  return { withPlus: "+" + digits, withoutPlus: digits };
}

Deno.serve(async (req) => {
  // Gupshup sends a GET ping when you first configure the webhook URL
  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Gupshup sometimes sends form-encoded with a "payload" field
      const text = await req.text();
      const params = new URLSearchParams(text);
      const payloadStr = params.get("payload");
      body = payloadStr ? JSON.parse(payloadStr) : JSON.parse(text || "{}");
    }

    console.log("Webhook body:", JSON.stringify(body));

    // Gupshup message envelope: { type, payload: { type, payload: { text }, sender: { phone } } }
    const type = body.type || body.payload?.type;
    if (type !== "message") {
      return new Response("OK", { status: 200 });
    }

    const inner = body.payload || body;
    const senderPhone: string =
      inner.payload?.sender?.phone ||
      inner.sender?.phone ||
      inner.source ||
      "";

    const messageText: string =
      inner.payload?.payload?.text ||
      inner.payload?.text ||
      inner.text ||
      "";

    if (!senderPhone || !messageText) {
      console.log("No sender or text — skipping");
      return new Response("OK", { status: 200 });
    }

    console.log(`From: ${senderPhone} | Text: "${messageText}"`);

    if (!isInterested(messageText)) {
      console.log("Not an interest reply — skipping");
      return new Response("OK", { status: 200 });
    }

    const { withPlus, withoutPlus } = normalisePhone(senderPhone);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error } = await supabase
      .from("onboarding_contacts")
      .update({
        contact_status: "interested",
        updated_at: new Date().toISOString(),
      })
      .or(`phone_number.eq.${withPlus},phone_number.eq.${withoutPlus}`);

    if (error) {
      console.error("Supabase update error:", error);
    } else {
      console.log(`Marked ${withPlus} as interested`);
    }

    // Always return 200 so Gupshup doesn't retry
    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return new Response("OK", { status: 200 });
  }
});
