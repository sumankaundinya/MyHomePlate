import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const GUPSHUP_API_KEY = Deno.env.get("GUPSHUP_API_KEY") || "";
const GUPSHUP_APP_NAME = Deno.env.get("GUPSHUP_APP_NAME") || "";
const GUPSHUP_SOURCE_NUMBER = Deno.env.get("GUPSHUP_SOURCE_NUMBER") || "";
const GUPSHUP_ONBOARDING_TEMPLATE_ID = Deno.env.get("GUPSHUP_ONBOARDING_TEMPLATE_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const TELUGU_MESSAGE = `నమస్కారం! 👋

మీరు ఇంట్లో చేసే వంట డబ్బు సంపాదించే అవకాశంగా మారితే? 🍛

*MyHomePlate* లో పార్టనర్ చెఫ్ గా చేరండి — మీ ఇంటి వంటను మీ పక్కనే ఉన్న వారికి అమ్మి, మీ సమయంలో మీరు సంపాదించండి!

🚫 Zomato & Swiggy: 25–30% కమీషన్ తీసుకుంటారు
✅ MyHomePlate:
   👉 మొదటి 6 నెలలు *0% కమీషన్* — మొత్తం మీకే!
   👉 తర్వాత 1 సంవత్సరం కేవలం *10%* మాత్రమే
   👉 ఆ తర్వాత *15%* — అది కూడా Zomato కంటే చాలా తక్కువ!

చేరడం పూర్తిగా ఉచితం. ఒక్కసారి చూడండి 👉 www.myhomeplate.in

ఆసక్తి ఉంటే *"Interested"* అని రిప్లై చేయండి — మేము మీకు కాల్ చేస్తాం! 📞`;

const ENGLISH_MESSAGE = `Hi! 👋

What if the food you already cook at home could earn you money? 🍛

Join *MyHomePlate* as a partner chef — sell home-cooked meals to people nearby and earn on your own schedule!

🚫 Zomato & Swiggy take 25–30% commission from every order
✅ MyHomePlate:
   👉 First 6 months: *0% commission* — you keep every rupee!
   👉 Next 1 year: just *10%* commission
   👉 After that: only *15%* — still nearly half of what others charge!

Joining is completely free. Check it out 👉 www.myhomeplate.in

Just reply *"Interested"* and we'll call you back! 📞`;

function formatPhone(phoneNumber: string): string {
  // Gupshup wants digits only, no + prefix (e.g. 919876543210)
  const trimmed = phoneNumber.trim();
  const digits = trimmed.replace(/\D/g, "");

  // If the original had a + (explicit country code), trust it as-is
  if (trimmed.startsWith("+")) {
    return digits;
  }

  // No country code — assume Indian (+91)
  if (!digits.startsWith("91")) {
    return "91" + digits.slice(-10);
  }
  return digits;
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

async function assertAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return "Missing authorization header";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return "Invalid token";
  const { data: role } = await supabase.from("user_roles")
    .select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!role) return "Admin access required";
  return null;
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

  const authError = await assertAdmin(req);
  if (authError) {
    return new Response(JSON.stringify({ error: authError }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
