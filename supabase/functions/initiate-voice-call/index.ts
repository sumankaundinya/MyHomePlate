import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface CallRequest {
  contact_id: string;
  phone_number: string;
  contact_type: "chef" | "customer";
  contact_name?: string;
  call_type: "chef_onboarding" | "customer_acquisition" | "follow_up";
}

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function initiateCall(
  phoneNumber: string,
  message: string
): Promise<string | null> {
  // Format phone number for Twilio (must include country code)
  let formattedPhone = phoneNumber.replace(/\D/g, "");
  if (!formattedPhone.startsWith("91")) {
    formattedPhone = "91" + formattedPhone.slice(-10);
  }
  formattedPhone = "+" + formattedPhone;

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Twiml: `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="alice">${escapeXml(message)}</Say>
              <Record maxLength="60" />
              <Hangup />
            </Response>`,
        }).toString(),
      }
    );

    const result = await response.json();
    return result.sid || null;
  } catch (error) {
    console.error("Twilio API error:", error);
    return null;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
}

function buildMessage(
  contactType: string,
  contactName: string | undefined,
  callType: string
): string {
  const name = contactName ? ` ${contactName}` : "";

  if (contactType === "chef") {
    if (callType === "chef_onboarding") {
      return `Hello${name}! This is MyHomePlate calling from Denmark. We are helping home cooks like you earn money by cooking and delivering meals in your neighborhood. Would you like to know more? Press 1 for yes, or just speak to confirm.`;
    } else if (callType === "follow_up") {
      return `Hi${name}, this is a follow-up from MyHomePlate. Have you had a chance to think about becoming a partner chef with us?`;
    }
  } else if (contactType === "customer") {
    return `Hello${name}! This is MyHomePlate. We connect you with verified home cooks who prepare fresh, authentic meals for pre-order. Interested in trying delicious homemade food? Press 1 for yes.`;
  }

  return `Hello${name}! This is MyHomePlate calling.`;
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
    const callRequest: CallRequest = await req.json();

    // Validate input
    if (!callRequest.phone_number || !callRequest.contact_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build personalized message
    const message = buildMessage(
      callRequest.contact_type,
      callRequest.contact_name,
      callRequest.call_type
    );

    // Initiate Twilio call
    const callSid = await initiateCall(callRequest.phone_number, message);

    if (!callSid) {
      return new Response(
        JSON.stringify({ error: "Failed to initiate call" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log call in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error: logError } = await supabase
      .from("voice_call_logs")
      .insert({
        contact_id: callRequest.contact_id,
        phone_number: callRequest.phone_number,
        call_sid: callSid,
        call_status: "initiated",
        call_type: callRequest.call_type,
      });

    if (logError) {
      console.error("Error logging call:", logError);
    }

    // Update contact status
    await supabase
      .from("onboarding_contacts")
      .update({ contact_status: "pending", updated_at: new Date().toISOString() })
      .eq("id", callRequest.contact_id);

    return new Response(
      JSON.stringify({
        success: true,
        call_sid: callSid,
        message: "Call initiated successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
