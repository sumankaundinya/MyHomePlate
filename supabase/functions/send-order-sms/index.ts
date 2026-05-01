import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface OrderNotification {
  phone_number: string;
  chef_id: string;
  meal_title: string;
  quantity: number;
  ready_time: string;
  earning: number;
  order_id?: string;
}

const GUPSHUP_API_URL = "https://api.gupshup.io/sm/api/v1/msg/send/simple";
const GUPSHUP_API_KEY = Deno.env.get("GUPSHUP_API_KEY") || "";
const GUPSHUP_APP_NAME = Deno.env.get("GUPSHUP_APP_NAME") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function sendGupshupSMS(
  phoneNumber: string,
  message: string
): Promise<any> {
  const formData = new URLSearchParams({
    apikey: GUPSHUP_API_KEY,
    appname: GUPSHUP_APP_NAME,
    to: phoneNumber,
    msg: message,
  });

  const response = await fetch(GUPSHUP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: formData.toString(),
  });

  return await response.json();
}

async function logNotification(
  supabase: any,
  chefId: string,
  phoneNumber: string,
  message: string,
  status: string,
  providerResponse: any,
  orderId?: string
) {
  try {
    await supabase.from("notification_logs").insert({
      chef_id: chefId,
      order_id: orderId,
      phone_number: phoneNumber,
      message,
      status,
      provider: "gupshup",
      provider_response: providerResponse,
    });
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS
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
    const notification: OrderNotification = await req.json();

    // Validate input
    if (!notification.phone_number || !notification.meal_title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format phone number for India (add +91 if needed)
    let phone = notification.phone_number.replace(/\D/g, "");
    if (!phone.startsWith("91")) {
      phone = "91" + phone.slice(-10);
    }
    phone = "+" + phone;

    // Build SMS message
    const message = `🍳 NEW ORDER - MyHomePlate

Dish: ${notification.meal_title}
Qty: ${notification.quantity}
Ready by: ${notification.ready_time}

Your earning: ₹${notification.earning}
Delivery: Pick up at your door

No need to open app!`;

    // Send SMS via Gupshup
    const smsResponse = await sendGupshupSMS(phone, message);

    // Initialize Supabase client for logging
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Determine status from response
    const status = smsResponse.status === "success" ? "sent" : "failed";

    // Log notification
    await logNotification(
      supabase,
      notification.chef_id,
      phone,
      message,
      status,
      smsResponse,
      notification.order_id
    );

    return new Response(
      JSON.stringify({
        success: status === "sent",
        message: `SMS ${status}`,
        provider_response: smsResponse,
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
