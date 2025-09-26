import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client using the anon key
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the price_id and optional coupon_code from request body
    const { price_id, coupon_code } = await req.json();
    if (!price_id) throw new Error("Price ID is required");
    logStep("Request data received", { price_id, hasCouponCode: !!coupon_code });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    const origin = req.headers.get("origin") || "https://dailyabcillustrations.com";
    
    // Handle coupon code validation and discount logic
    let discountConfig = null;
    
    if (coupon_code) {
      // Manual coupon code provided - validate it with Stripe
      try {
        const coupon = await stripe.coupons.retrieve(coupon_code);
        if (coupon && coupon.valid) {
          discountConfig = [{ coupon: coupon_code }];
          logStep("Manual coupon validated", { coupon_code, couponValid: true });
        } else {
          throw new Error("Invalid coupon code");
        }
      } catch (couponError) {
        const errorMessage = couponError instanceof Error ? couponError.message : String(couponError);
        logStep("Coupon validation failed", { coupon_code, error: errorMessage });
        throw new Error("Invalid coupon code provided");
      }
    }
    
    // Prepare checkout session configuration
    const sessionConfig = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: "subscription" as const,
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription/cancel`,
      metadata: {
        user_id: user.id,
        coupon_applied: coupon_code || "none",
      },
      // Apply discount if available
      ...(discountConfig && { discounts: discountConfig }),
      // Allow promotion codes to be entered during checkout as well
      allow_promotion_codes: !discountConfig, // Only allow if no discount already applied
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});