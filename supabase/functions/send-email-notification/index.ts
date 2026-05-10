import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OrderEvent = "placed" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";

interface EmailPayload {
  to: string;
  event: OrderEvent;
  customerName: string;
  chefName: string;
  mealTitle: string;
  orderId: string;
  totalPrice: number;
  quantity: number;
}

function buildSubject(event: OrderEvent, mealTitle: string): string {
  const map: Record<OrderEvent, string> = {
    placed:           `Order placed — ${mealTitle}`,
    accepted:         `Your order has been accepted — ${mealTitle}`,
    preparing:        `${mealTitle} is being prepared`,
    ready:            `${mealTitle} is ready for pickup`,
    out_for_delivery: `${mealTitle} is on the way`,
    delivered:        `Your order has been delivered — ${mealTitle}`,
    cancelled:        `Order cancelled — ${mealTitle}`,
  };
  return map[event];
}

function buildHtml(p: EmailPayload): string {
  const statusMessages: Record<OrderEvent, string> = {
    placed:           "We have received your order and it will be confirmed shortly.",
    accepted:         "Great news! The chef has accepted your order and will start preparing it soon.",
    preparing:        "Your delicious meal is currently being prepared with care.",
    ready:            "Your order is ready! It will be picked up for delivery shortly.",
    out_for_delivery: "Your order is on the way. Sit tight!",
    delivered:        "Your order has been delivered. Enjoy your meal! Don't forget to leave a review.",
    cancelled:        "Your order has been cancelled. If a payment was made, a refund will be processed within 5-7 business days.",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MyHomePlate Order Update</title>
</head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#f7931e);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MyHomePlate</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Homemade food, delivered with love</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">Hi <strong>${p.customerName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:16px;color:#555;">${statusMessages[p.event]}</p>

            <!-- Order Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3;border:1px solid #ffe0cc;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px;">
                <h3 style="margin:0 0 12px;font-size:18px;color:#ff6b35;">${p.mealTitle}</h3>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr>
                    <td style="color:#888;font-size:13px;">Chef</td>
                    <td style="color:#333;font-size:13px;text-align:right;"><strong>${p.chefName}</strong></td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;">Quantity</td>
                    <td style="color:#333;font-size:13px;text-align:right;"><strong>${p.quantity}</strong></td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;">Total</td>
                    <td style="color:#ff6b35;font-size:15px;font-weight:700;text-align:right;">₹${p.totalPrice}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:12px;">Order ID</td>
                    <td style="color:#aaa;font-size:12px;text-align:right;">${p.orderId.slice(0, 8).toUpperCase()}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0;font-size:14px;color:#888;">
              Questions? Reply to this email or contact us at support@myhomeplate.in
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f3ede7;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              © 2026 MyHomePlate · Homemade food, delivered with love<br>
              You received this email because you placed an order on MyHomePlate.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    const { to, event, customerName, chefName, mealTitle, orderId, totalPrice, quantity } = payload;

    if (!to || !event) {
      return new Response(JSON.stringify({ error: "to and event are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyHomePlate <orders@myhomeplate.in>",
        to: [to],
        subject: buildSubject(event, mealTitle),
        html: buildHtml({ to, event, customerName, chefName, mealTitle, orderId, totalPrice, quantity }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || "Resend error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
