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

  try {
    const { order_id, chef_id } = await req.json();

    if (!order_id || !chef_id) {
      return new Response(
        JSON.stringify({ error: "order_id and chef_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    // Your RazorpayX current account number — set this in Supabase edge function secrets
    const accountNumber = Deno.env.get("RAZORPAY_ACCOUNT_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!keyId || !keySecret || !accountNumber) {
      return new Response(
        JSON.stringify({ error: "Razorpay payout keys not configured. Set RAZORPAY_ACCOUNT_NUMBER in edge function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const credentials = btoa(`${keyId}:${keySecret}`);

    // 1. Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_price, payment_status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Order has not been paid — no payout triggered" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get active commission rate
    const { data: tier } = await supabase
      .from("commission_tiers")
      .select("commission_rate")
      .eq("is_active", true)
      .lte("valid_from", new Date().toISOString())
      .gt("valid_to", new Date().toISOString())
      .maybeSingle();

    const commissionRate = Number(tier?.commission_rate ?? 10);
    const orderAmount = Number(order.total_price);
    const commissionAmount = parseFloat(((orderAmount * commissionRate) / 100).toFixed(2));
    const payoutAmount = parseFloat((orderAmount - commissionAmount).toFixed(2));
    const payoutAmountPaise = Math.round(payoutAmount * 100);

    // 3. Fetch chef payout details
    const { data: payoutDetails } = await supabase
      .from("chef_payout_details")
      .select("*")
      .eq("chef_id", chef_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!payoutDetails) {
      return new Response(
        JSON.stringify({ error: "No payout details found. Please add your UPI ID or bank account in your profile." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create Razorpay contact if not already done
    let razorpayContactId = payoutDetails.razorpay_contact_id;
    let razorpayFundAccountId = payoutDetails.razorpay_fund_account_id;

    if (!razorpayContactId) {
      const { data: chef } = await supabase
        .from("chefs")
        .select("user_id, profiles(name, email)")
        .eq("id", chef_id)
        .single();

      const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: (chef?.profiles as any)?.name || payoutDetails.account_holder_name || "Chef",
          email: (chef?.profiles as any)?.email,
          type: "vendor",
          reference_id: chef_id,
        }),
      });

      const contactData = await contactRes.json();
      if (!contactRes.ok) {
        return new Response(
          JSON.stringify({ error: contactData.error?.description || "Failed to create Razorpay contact" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      razorpayContactId = contactData.id;
    }

    // 5. Create Razorpay fund account if not already done
    if (!razorpayFundAccountId) {
      const fundAccountBody: Record<string, unknown> = { contact_id: razorpayContactId };

      if (payoutDetails.payout_method === "upi") {
        fundAccountBody.account_type = "vpa";
        fundAccountBody.vpa = { address: payoutDetails.upi_id };
      } else {
        fundAccountBody.account_type = "bank_account";
        fundAccountBody.bank_account = {
          name: payoutDetails.account_holder_name,
          ifsc: payoutDetails.ifsc_code,
          account_number: payoutDetails.account_number,
        };
      }

      const fundRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fundAccountBody),
      });

      const fundData = await fundRes.json();
      if (!fundRes.ok) {
        return new Response(
          JSON.stringify({ error: fundData.error?.description || "Failed to create fund account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      razorpayFundAccountId = fundData.id;

      // Save Razorpay IDs so we reuse them for future payouts
      await supabase
        .from("chef_payout_details")
        .update({
          razorpay_contact_id: razorpayContactId,
          razorpay_fund_account_id: razorpayFundAccountId,
        })
        .eq("chef_id", chef_id);
    }

    // 6. Insert payout ledger record (processing)
    const { data: payoutRecord, error: insertError } = await supabase
      .from("chef_payouts")
      .insert({
        chef_id,
        order_id,
        order_amount: orderAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        payout_amount: payoutAmount,
        razorpay_fund_account_id: razorpayFundAccountId,
        payout_method: payoutDetails.payout_method,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError || !payoutRecord) {
      return new Response(
        JSON.stringify({ error: "Failed to create payout record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Initiate Razorpay payout
    const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "X-Payout-Idempotency": payoutRecord.id,
      },
      body: JSON.stringify({
        account_number: accountNumber,
        fund_account_id: razorpayFundAccountId,
        amount: payoutAmountPaise,
        currency: "INR",
        mode: payoutDetails.payout_method === "upi" ? "UPI" : "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: payoutRecord.id,
        narration: "MyHomePlate order earnings",
      }),
    });

    const payoutData = await payoutRes.json();

    if (!payoutRes.ok) {
      await supabase
        .from("chef_payouts")
        .update({
          status: "failed",
          failure_reason: payoutData.error?.description || "Razorpay payout failed",
        })
        .eq("id", payoutRecord.id);

      return new Response(
        JSON.stringify({ error: payoutData.error?.description || "Payout failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Update ledger with Razorpay payout ID
    await supabase
      .from("chef_payouts")
      .update({
        razorpay_payout_id: payoutData.id,
        status: payoutData.status === "processed" ? "processed" : "processing",
      })
      .eq("id", payoutRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        payout_id: payoutData.id,
        amount: payoutAmount,
        status: payoutData.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
