import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("GUPSHUP_WEBHOOK_SECRET") || "";

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
  const variants = new Set<string>();
  variants.add("+" + digits);
  variants.add(digits);
  if (!digits.startsWith("91")) {
    variants.add("+91" + digits.slice(-10));
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

  if (WEBHOOK_SECRET) {
    const incomingSecret = req.headers.get("x-gupshup-secret") ||
                           req.headers.get("x-webhook-secret") || "";
    if (incomingSecret !== WEBHOOK_SECRET) {
      console.log("Webhook secret mismatch — rejecting request");
      return new Response("OK", { status: 200 });
    }
  }

  try {
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const payloadStr = params.get("payload");
      body = payloadStr ? JSON.parse(payloadStr) : JSON.parse(text || "{}");
    }

    console.log("Webhook body:", JSON.stringify(body));

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

    const messageType: string =
      inner.payload?.payload?.type ||
      inner.payload?.type ||
      "text";

    const gupshupMessageId: string =
      inner.payload?.id ||
      inner.id ||
      body.messageId ||
      "";

    if (!senderPhone || !messageText) {
      console.log("No sender or text — skipping");
      return new Response("OK", { status: 200 });
    }

    console.log(`From: ${senderPhone} | Text: "${messageText}"`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Look up the contact for this phone number
    const variants = phoneVariants(senderPhone);
    const orFilter = variants.map((v) => `phone_number.eq.${v}`).join(",");

    const { data: contacts } = await supabase
      .from("onboarding_contacts")
      .select("id")
      .or(orFilter)
      .limit(1);

    const contactId: string | null = contacts?.[0]?.id ?? null;

    // Save every inbound message regardless of content
    const { error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        contact_id: contactId,
        phone_number: senderPhone,
        message_text: messageText,
        message_type: messageType,
        direction: "inbound",
        gupshup_message_id: gupshupMessageId || null,
        is_read: false,
      });

    if (insertError) {
      console.error("Failed to save message:", insertError);
    } else {
      console.log(`Saved message from ${senderPhone} (contact: ${contactId ?? "unknown"})`);
    }

    // Update contact status on keyword match
    if (contactId && isInterested(messageText)) {
      const { error: updateError } = await supabase
        .from("onboarding_contacts")
        .update({
          contact_status: "interested",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      if (updateError) {
        console.error("Supabase update error:", updateError);
      } else {
        console.log(`Marked ${senderPhone} as interested`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return new Response("OK", { status: 200 });
  }
});
