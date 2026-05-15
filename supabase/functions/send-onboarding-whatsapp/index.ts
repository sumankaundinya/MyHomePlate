import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GUPSHUP_API_KEY = Deno.env.get("GUPSHUP_API_KEY") || "";
const GUPSHUP_APP_NAME = Deno.env.get("GUPSHUP_APP_NAME") || "";
const GUPSHUP_SOURCE_NUMBER = Deno.env.get("GUPSHUP_SOURCE_NUMBER") || "";
const GUPSHUP_ONBOARDING_TEMPLATE_ID = Deno.env.get("GUPSHUP_ONBOARDING_TEMPLATE_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const TELUGU_MESSAGE = `నమస్కారం! మీరు ఇంటి నుండి వంట చేసి డబ్బు సంపాదించాలనుకుంటున్నారా?

MyHomePlate లో పార్టనర్ చెఫ్ గా చేరడం పూర్తిగా ఉచితం. మీ ఇంటి వంటను మీ పక్కనే ఉన్న వారికి అమ్మి సొంతంగా సంపాదించండి.

ఆసక్తి ఉంటే "ఆసక్తి" అని రిప్లై చేయండి — మేము మీకు కాల్ చేస్తాం!`;

const ENGLISH_MESSAGE = `Hi! Want to earn money cooking from home?

Joining MyHomePlate as a partner chef is completely free. Cook meals for people in your neighborhood and earn on your own terms.

If interested, just reply "Interested" — we'll call you back!`;

function formatPhone(phoneNumber: string): string {
  // Gupshup wants digits only, no + prefix (e.g. 919876543210)
  let phone = phoneNumber.replace(/\D/g, "");
  if (!phone.startsWith("91")) {
    phone = "91" + phone.slice(-10);
  }
  return phone;
}

async function sendWhatsApp(
  phoneNumber: string,
  language: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const destination = formatPhone(phoneNumber);
  const source = GUPSHUP_SOURCE_NUMBER.replace(/\D/g, "");
  const messageText = language === "telugu" ? TELUGU_MESSAGE : ENGLISH_MESSAGE;

  // apikey passed as query param (required for WABA/FBC hosted apps)
  const baseUrl = GUPSHUP_ONBOARDING_TEMPLATE_ID
    ? "https://api.gupshup.io/wa/api/v1/template/msg"
    : "https://api.gupshup.io/wa/api/v1/msg";
  const url = `${baseUrl}?apikey=${encodeURIComponent(GUPSHUP_API_KEY)}`;

  let body: URLSearchParams;

  if (GUPSHUP_ONBOARDING_TEMPLATE_ID) {
    body = new URLSearchParams({
      channel: "whatsapp",
      source,
      destination,
      template: JSON.stringify({ id: GUPSHUP_ONBOARDING_TEMPLATE_ID, params: [] }),
      "src.name": GUPSHUP_APP_NAME,
    });
  } else {
    body = new URLSearchParams({
      channel: "whatsapp",
      source,
      destination,
      message: JSON.stringify({ type: "text", text: messageText }),
      "src.name": GUPSHUP_APP_NAME,
    });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "apikey": GUPSHUP_API_KEY,
      },
      body: body.toString(),
    });

    const text = await response.text();
    console.log(`Gupshup response (${response.status}):`, text);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}

    if (parsed.status === "error" || parsed.response?.status === "error") {
      return { success: false, error: parsed.response?.details || text };
    }

    return {
      success: true,
      messageId: parsed.messageId || parsed.response?.id,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { contact_id, phone_number, language = "telugu" } = await req.json();

    if (!contact_id || !phone_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await sendWhatsApp(phone_number, language);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (result.success) {
      await supabase
        .from("onboarding_contacts")
        .update({
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString(),
        })
        .eq("id", contact_id);
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
