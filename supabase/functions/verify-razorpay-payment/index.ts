import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const body = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const computed = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === signature;
}

async function notifyChef(
  supabase: ReturnType<typeof createClient>,
  resendKey: string,
  orderId: string,
) {
  const { data: order } = await supabase
    .from("orders")
    .select("chef_id, quantity, total_price, customer_id, meals(title)")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const [{ data: chefProfile }, { data: customerProfile }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", order.chef_id).single(),
    supabase.from("profiles").select("name").eq("id", order.customer_id).single(),
  ]);

  if (!chefProfile?.email) return;

  const mealTitle = (order.meals as any)?.title || "Meal";
  const customerName = customerProfile?.name || "A customer";
  const shortId = orderId.slice(0, 8).toUpperCase();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MyHomePlate <orders@myhomeplate.in>",
      to: [chefProfile.email],
      subject: `New Order — ${mealTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#f7931e);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MyHomePlate</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">New Order Received!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">Hi <strong>${chefProfile.name || "Chef"}</strong>,</p>
            <p style="margin:0 0 24px;font-size:16px;color:#555;">You have a new paid order waiting for your confirmation. Please accept or reject it from your dashboard.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3;border:1px solid #ffe0cc;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px;">
                <h3 style="margin:0 0 12px;font-size:18px;color:#ff6b35;">${mealTitle}</h3>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr>
                    <td style="color:#888;font-size:13px;">Customer</td>
                    <td style="color:#333;font-size:13px;text-align:right;"><strong>${customerName}</strong></td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;">Quantity</td>
                    <td style="color:#333;font-size:13px;text-align:right;"><strong>${order.quantity}</strong></td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;">Amount Paid</td>
                    <td style="color:#ff6b35;font-size:15px;font-weight:700;text-align:right;">₹${order.total_price}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:12px;">Order ID</td>
                    <td style="color:#aaa;font-size:12px;text-align:right;">${shortId}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="https://www.myhomeplate.in/chef-dashboard" style="background:#ff6b35;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Go to Dashboard</a>
            </div>
            <p style="margin:0;font-size:14px;color:#888;">Questions? Contact us at support@myhomeplate.in</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f3ede7;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">© 2026 MyHomePlate · Homemade food, delivered with love</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, internal_order_id } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !internal_order_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Razorpay secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_id: razorpay_payment_id,
        payment_status: "paid",
        status: "pending",
      })
      .eq("id", internal_order_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notify chef (fire and forget — don't block the response)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      notifyChef(supabase, resendKey, internal_order_id).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
