import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const ADMIN_EMAIL = "suman@myhomeplate.in";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { name, phone, area, experience, message } = await req.json();

    if (!name || !phone || !area) {
      return new Response(
        JSON.stringify({ error: "Name, phone, and area are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check for duplicate application
    const digits = phone.replace(/\D/g, "");
    const { data: existing } = await supabase
      .from("onboarding_contacts")
      .select("id")
      .eq("phone_number", phone)
      .eq("contact_type", "field_agent")
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "An application with this phone number already exists." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to onboarding_contacts
    const { error: insertError } = await supabase
      .from("onboarding_contacts")
      .insert({
        name,
        phone_number: phone,
        area,
        contact_type: "field_agent",
        contact_status: "not_contacted",
      });

    if (insertError) throw insertError;

    // Send email notification to admin
    if (RESEND_API_KEY) {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#f7931e);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MyHomePlate</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">New Field Agent Application</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 24px;font-size:20px;color:#333;">You have a new application!</h2>
            <table width="100%" cellpadding="8" cellspacing="0" style="background:#fff8f3;border:1px solid #ffe0cc;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="color:#888;font-size:13px;width:40%;">Name</td>
                <td style="color:#333;font-size:14px;font-weight:600;">${name}</td>
              </tr>
              <tr style="border-top:1px solid #ffe0cc;">
                <td style="color:#888;font-size:13px;padding-top:8px;">Phone</td>
                <td style="color:#333;font-size:14px;font-weight:600;">${phone}</td>
              </tr>
              <tr style="border-top:1px solid #ffe0cc;">
                <td style="color:#888;font-size:13px;padding-top:8px;">Area / City</td>
                <td style="color:#333;font-size:14px;font-weight:600;">${area}</td>
              </tr>
              <tr style="border-top:1px solid #ffe0cc;">
                <td style="color:#888;font-size:13px;padding-top:8px;">Experience</td>
                <td style="color:#333;font-size:14px;">${experience || "Not specified"}</td>
              </tr>
              ${message ? `
              <tr style="border-top:1px solid #ffe0cc;">
                <td style="color:#888;font-size:13px;padding-top:8px;">Message</td>
                <td style="color:#333;font-size:14px;">${message}</td>
              </tr>` : ""}
            </table>
            <p style="margin:0;font-size:14px;color:#555;">
              This applicant has been added to your <strong>Voice Onboarding</strong> page automatically.
              You can send them a WhatsApp message or initiate a call from there.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f3ede7;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">© 2026 MyHomePlate · Field Agent Applications</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MyHomePlate <orders@myhomeplate.in>",
          to: [ADMIN_EMAIL],
          subject: `New Field Agent Application — ${name} (${area})`,
          html,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Application submitted successfully!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
