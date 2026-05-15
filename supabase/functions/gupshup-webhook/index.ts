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

function phoneVariants(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  // Build several formats to try — we don't know if it's Indian or international
  const variants = new Set<string>();
  variants.add("+" + digits);          // +4571361727 or +919876543210
  variants.add(digits);                // 4571361727  or 919876543210
  if (!digits.startsWith("91")) {
    variants.add("+91" + digits.slice(-10)); // Indian fallback
    variants.add("91" + digits.slice(-10));
  }
  return Array.from(variants);
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

    const variants = phoneVariants(senderPhone);
    const orFilter = variants.map((v) => `phone_number.eq.${v}`).join(",");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error } = await supabase
      .from("onboarding_contacts")
      .update({
        contact_status: "interested",
        updated_at: new Date().toISOString(),
      })
      .or(orFilter);

    if (error) {
      console.error("Supabase update error:", error);
    } else {
      console.log(`Marked ${variants[0]} as interested`);
    }

    // Always return 200 so Gupshup doesn't retry
    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return new Response("OK", { status: 200 });
  }
});
