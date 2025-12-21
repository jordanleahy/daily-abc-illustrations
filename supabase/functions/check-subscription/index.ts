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

// In-memory cache to prevent rate limiting (5-second TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds

const getCachedResult = (key: string): any | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  
  logStep("Using cached result", { key, age: `${age}ms` });
  return entry.data;
};

const setCachedResult = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Clean up old entries (keep cache small)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

// Retry helper with exponential backoff for rate limits
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      const isRateLimit = error?.message?.includes('rate limit') || 
                         error?.statusCode === 429 ||
                         error?.code === 'rate_limit';
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error; // Not a rate limit or last attempt
      }
      
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      logStep(`Rate limit hit, retrying in ${delayMs}ms`, { attempt: attempt + 1, maxRetries });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
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

    // Stripe key will be checked only after successful authentication

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided - treating as unauthenticated");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      const msg = userError.message || '';
      // Handle connection pool exhaustion gracefully
      if (msg.includes('connection slots') || msg.includes('SUPERUSER')) {
        logStep("Database connection pool exhausted - retry needed");
        throw new Error("Service temporarily unavailable - too many concurrent requests. Please try again.");
      }
      // Treat unexpected auth failures as unauthenticated, not a server error
      if (msg.toLowerCase().includes('unexpected')) {
        logStep("Auth unexpected failure - returning unsubscribed");
        return new Response(JSON.stringify({ subscribed: false, error: 'unauthenticated' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      logStep("Authentication error", { message: msg });
      return new Response(JSON.stringify({ subscribed: false, error: 'unauthenticated' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("No user email - treating as unauthenticated");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check cache first to prevent rate limiting
    const cacheKey = `subscription_${user.email}`;
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return new Response(JSON.stringify(cachedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check trial status FIRST before checking Stripe
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', user.id)
      .single();

    if (!profileError && profile?.trial_ends_at) {
      const trialEndsAt = new Date(profile.trial_ends_at);
      const isInTrial = trialEndsAt > new Date();
      
      if (isInTrial) {
        logStep("User is in active trial", { trialEndsAt: profile.trial_ends_at });
        const trialResult = {
          subscribed: true,
          is_trial: true,
          trial_ends_at: profile.trial_ends_at,
        };
        setCachedResult(cacheKey, trialResult);
        return new Response(JSON.stringify(trialResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // If not in trial, check Stripe subscription
    // Retrieve Stripe key only after authentication
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Stripe key missing - returning unsubscribed");
      const result = { subscribed: false };
      setCachedResult(cacheKey, result);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Query Stripe API with retry logic for rate limits
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const customers = await retryWithBackoff(() => 
      stripe.customers.list({ email: user.email, limit: 1 })
    );
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      const result = { subscribed: false };
      setCachedResult(cacheKey, result);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await retryWithBackoff(() =>
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      })
    );

    const hasActiveSub = subscriptions.data.length > 0;
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
      
      // Get current_period_end - check both root and item level
      let periodEnd = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;
      
      // Handle null/undefined current_period_end
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
      
      productId = subscription.items.data[0].price.product;
      priceId = subscription.items.data[0].price.id;
      interval = subscription.items.data[0].price.recurring?.interval || null;
      cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
      logStep("Determined subscription details", { productId, priceId, interval, cancelAtPeriodEnd });
    } else {
      logStep("No active subscription found");
    }

    const result = {
      subscribed: hasActiveSub,
      product_id: productId,
      price_id: priceId,
      interval: interval,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd
    };

    // Update subscription cache in database for RLS policies
    try {
      const subscriptionTier = hasActiveSub && productId ? 'plus' : null;
      const expiresAt = subscriptionEnd ? new Date(subscriptionEnd) : null;
      
      await supabaseClient.rpc('update_subscription_cache', {
        p_user_id: user.id,
        p_has_active_subscription: hasActiveSub,
        p_subscription_tier: subscriptionTier,
        p_expires_at: expiresAt
      });
      
      logStep("Updated subscription cache in database", { 
        userId: user.id, 
        hasSubscription: hasActiveSub,
        tier: subscriptionTier 
      });
    } catch (cacheError) {
      // Don't fail the request if cache update fails - just log it
      logStep("Failed to update subscription cache", { 
        error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
      });
    }

    // Cache the result in memory
    setCachedResult(cacheKey, result);

    return new Response(JSON.stringify(result), {
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
