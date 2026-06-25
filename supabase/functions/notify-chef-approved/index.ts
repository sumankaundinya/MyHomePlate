import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chef_user_id, status } = await req.json();
    if (!chef_user_id || !["approved", "rejected"].includes(status)) {
      return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", chef_user_id)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: "Chef profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chefName = profile.name || "Chef";

    if (status === "approved") {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MyHomePlate <no-reply@myhomeplate.in>",
          to: [profile.email],
          subject: "You're approved on MyHomePlate!",
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
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your kitchen is open!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">Hi <strong>${chefName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:16px;color:#555;">
              Great news — your MyHomePlate chef account has been <strong style="color:#27ae60;">approved</strong>!
              You can now add meals, set your availability, and start receiving orders.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="https://www.myhomeplate.in/partner"
                 style="background:#ff6b35;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                Go to your dashboard
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#555;">What you can do now:</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#555;line-height:1.8;">
              <li>Add your meals with photos and prices</li>
              <li>Set your cooking schedule and availability</li>
              <li>Receive orders and manage deliveries</li>
              <li>Track your earnings and payments</li>
            </ul>
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
    } else {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MyHomePlate <no-reply@myhomeplate.in>",
          to: [profile.email],
          subject: "Update on your MyHomePlate chef application",
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#888;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MyHomePlate</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">Hi <strong>${chefName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:16px;color:#555;">
              Thank you for applying to cook on MyHomePlate. Unfortunately we are unable to approve your
              application at this time. If you have questions or would like to re-apply, please email us at
              <a href="mailto:support@myhomeplate.in" style="color:#ff6b35;">support@myhomeplate.in</a>.
            </p>
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
