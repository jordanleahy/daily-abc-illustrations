import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // You can assume that the secret key is available in the environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // PHASE 1: Check database cache first for fast response
    logStep("Checking database for cached subscription");
    const { data: dbSub, error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbSub && !dbError && dbSub.current_period_end) {
      // Check if subscription is still valid
      const isValid = new Date(dbSub.current_period_end) > new Date();
      
      if (isValid) {
        logStep("Using cached subscription from database", {
          subscriptionId: dbSub.stripe_subscription_id,
          endDate: dbSub.current_period_end
        });
        
        // Determine interval from price_id
        const interval = dbSub.stripe_price_id?.includes('annual') ? 'year' : 'month';
        
        return new Response(JSON.stringify({
          subscribed: true,
          product_id: dbSub.stripe_product_id,
          price_id: dbSub.stripe_price_id,
          interval: interval,
          subscription_end: dbSub.current_period_end,
          cancel_at_period_end: dbSub.cancel_at_period_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Cached subscription expired, falling back to Stripe API");
      }
    } else {
      logStep("No valid cached subscription, querying Stripe API", { 
        dbError: dbError?.message 
      });
    }

    // PHASE 2: Fallback to Stripe API if no valid cache found
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    // This is a Stripe product ID
    let productId = null;
    let subscriptionEnd = null;
    let priceId = null;
    let interval = null;
    let cancelAtPeriodEnd = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Raw subscription data", { 
        subscriptionId: subscription.id, 
        currentPeriodEnd: subscription.current_period_end,
        status: subscription.status,
        itemsCount: subscription.items?.data?.length 
      });
      
      // Get current_period_end - check both subscription root and first item
      let periodEnd = subscription.current_period_end;
      
      // Fallback to subscription item's current_period_end if not found at root level
      if (!periodEnd && subscription.items?.data?.[0]?.current_period_end) {
        periodEnd = subscription.items.data[0].current_period_end;
        logStep("Using current_period_end from subscription item", { periodEnd });
      }
      
      // Handle null/undefined current_period_end (can happen with 100% off coupons)
      try {
        if (periodEnd && typeof periodEnd === 'number') {
          const endDate = new Date(periodEnd * 1000);
          if (!isNaN(endDate.getTime())) {
            subscriptionEnd = endDate.toISOString();
            logStep("Parsed subscription end date", { subscriptionEnd });
          } else {
            logStep("Invalid date from current_period_end", { current_period_end: periodEnd });
          }
        } else {
          logStep("No current_period_end found", { 
            rootPeriodEnd: subscription.current_period_end,
            itemPeriodEnd: subscription.items?.data?.[0]?.current_period_end 
          });
        }
      } catch (dateError) {
        logStep("Error parsing subscription end date", { 
          error: dateError instanceof Error ? dateError.message : String(dateError),
          current_period_end: periodEnd 
        });
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Subscription tier is the product ID
      productId = subscription.items.data[0].price.product;
      priceId = subscription.items.data[0].price.id;
      interval = subscription.items.data[0].price.recurring?.interval || null;
      cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
      logStep("Determined subscription details", { productId, priceId, interval, cancelAtPeriodEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      price_id: priceId,
      interval: interval,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});