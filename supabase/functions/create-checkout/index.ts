import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    // Get and validate checkout params
    const CheckoutRequestSchema = z.object({
      price_id: z.string().optional(),
      product_id: z.string().optional(),
      plan_type: z.enum(['monthly', 'annual']).optional()
    }).refine(
      (data) => data.price_id || data.product_id || data.plan_type,
      { message: "At least one of price_id, product_id, or plan_type must be provided" }
    );
    
    const body = await req.json();
    const { price_id, product_id, plan_type } = CheckoutRequestSchema.parse(body);
    logStep("Request data received", { price_id, product_id, plan_type });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Resolve to an active price ID before creating the session
    const PRODUCT_MAP: Record<string, string> = {
      monthly: "prod_T7a3qkxm69uttK",
      annual: "prod_T7a5vTweAt6UZm",
    };

    let resolvedPriceId: string | undefined = price_id as string | undefined;
    let targetProductId: string | undefined = product_id || (plan_type ? PRODUCT_MAP[plan_type] : undefined);

    const resolveActivePrice = async () => {
      if (resolvedPriceId) {
        try {
          const p = await stripe.prices.retrieve(resolvedPriceId);
          if (!p.active) {
            if (!targetProductId) targetProductId = String(p.product);
          } else {
            return; // already active
          }
        } catch (_) {
          // price retrieval failed; fall back to product below
        }
      }

      if (!targetProductId) {
        throw new Error("No valid price or product provided");
      }

      const active = await stripe.prices.list({ product: targetProductId, active: true, limit: 1 });
      if (active.data.length === 0) {
        throw new Error("No active price found for the selected product");
      }
      resolvedPriceId = active.data[0].id;
      logStep("Resolved active price", { resolvedPriceId, targetProductId });
    };

    await resolveActivePrice();
    
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
    
    // Prepare checkout session configuration
    const sessionConfig = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: resolvedPriceId!,
          quantity: 1,
        },
      ],
      mode: "subscription" as const,
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription/cancel`,
      metadata: {
        user_id: user.id,
      },
      // Allow promotion codes to be entered during checkout
      allow_promotion_codes: true,
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
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input',
        details: error.errors 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});