import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { coupon_code } = await req.json();
    if (!coupon_code) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Coupon code is required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Validating coupon", { couponCode: coupon_code });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the coupon from Stripe
    const coupon = await stripe.coupons.retrieve(coupon_code);
    logStep("Coupon retrieved", { 
      id: coupon.id, 
      valid: coupon.valid,
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off
    });

    // Check if coupon is valid and active
    if (!coupon.valid) {
      return new Response(JSON.stringify({
        valid: false,
        error: "This coupon is no longer valid"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check redeem_by date if set
    if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
      return new Response(JSON.stringify({
        valid: false,
        error: "This coupon has expired"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check max_redemptions if set
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return new Response(JSON.stringify({
        valid: false,
        error: "This coupon has reached its usage limit"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Return successful validation with coupon details
    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
        name: coupon.name
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-coupon", { message: errorMessage });
    
    // Handle specific Stripe errors
    if (errorMessage.includes("No such coupon")) {
      return new Response(JSON.stringify({
        valid: false,
        error: "Invalid coupon code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      valid: false, 
      error: "Failed to validate coupon. Please try again." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});