import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import Stripe from "https://esm.sh/stripe@18.5.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// In-memory cache with 30-second TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000;

const pendingRequests = new Map<string, Promise<any>>();

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
  
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
};

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
      
      const isRateLimit = error?.message?.includes('rate limit') || 
                         error?.statusCode === 429 ||
                         error?.code === 'rate_limit';
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      logStep(`Rate limit hit, retrying in ${delayMs}ms`, { attempt: attempt + 1, maxRetries });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
};

async function checkSubscriptionForUser(
  supabaseClient: any,
  user: { id: string; email: string },
  cacheKey: string
): Promise<any> {
  // Check trial status FIRST
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
      return {
        subscribed: true,
        is_trial: true,
        trial_ends_at: profile.trial_ends_at,
      };
    }
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("Stripe key missing - returning unsubscribed");
    return { subscribed: false };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  const customers = await retryWithBackoff(() => 
    stripe.customers.list({ email: user.email, limit: 1 })
  );
  
  if (customers.data.length === 0) {
    logStep("No customer found, returning unsubscribed state");
    return { subscribed: false };
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
      status: subscription.status,
      itemsCount: subscription.items?.data?.length 
    });
    
    let periodEnd = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;
    
    try {
      if (periodEnd && typeof periodEnd === 'number') {
        const endDate = new Date(periodEnd * 1000);
        if (!isNaN(endDate.getTime())) {
          subscriptionEnd = endDate.toISOString();
          logStep("Parsed subscription end date", { subscriptionEnd });
        }
      }
    } catch (dateError) {
      logStep("Error parsing subscription end date", { 
        error: dateError instanceof Error ? dateError.message : String(dateError)
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

  // Update subscription cache in database
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
    logStep("Failed to update subscription cache", { 
      error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
    });
  }

  return result;
}

Deno.serve(createHandler({
  name: 'check-subscription',
  clientMode: 'service',
  requireAuth: false, // We handle auth manually for graceful fallback
}, async ({ supabase, req }) => {
  logStep("Function started");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    logStep("No authorization header provided - treating as unauthenticated");
    return successResponse({ subscribed: false });
  }
  
  logStep("Authorization header found");
  const token = authHeader.replace("Bearer ", "");
  logStep("Authenticating user with token");
  
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError) {
    const msg = userError.message || '';
    if (msg.includes('connection slots') || msg.includes('SUPERUSER')) {
      logStep("Database connection pool exhausted - retry needed");
      throw new Error("Service temporarily unavailable - too many concurrent requests. Please try again.");
    }
    if (msg.toLowerCase().includes('unexpected')) {
      logStep("Auth unexpected failure - returning unsubscribed");
      return successResponse({ subscribed: false, error: 'unauthenticated' });
    }
    logStep("Authentication error", { message: msg });
    return successResponse({ subscribed: false, error: 'unauthenticated' });
  }
  
  const user = userData.user;
  if (!user?.email) {
    logStep("No user email - treating as unauthenticated");
    return successResponse({ subscribed: false });
  }
  logStep("User authenticated", { userId: user.id, email: user.email });

  // Check cache first
  const cacheKey = `subscription_${user.email}`;
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    return successResponse(cachedResult);
  }

  // Check if there's already a pending request for this user - DEDUPLICATION
  const existingRequest = pendingRequests.get(cacheKey);
  if (existingRequest) {
    logStep("Waiting for existing request", { cacheKey });
    const result = await existingRequest;
    return successResponse(result);
  }

  // Create pending request promise for deduplication
  const requestPromise = checkSubscriptionForUser(
    supabase,
    { id: user.id, email: user.email },
    cacheKey
  );
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    setCachedResult(cacheKey, result);
    return successResponse(result);
  } finally {
    pendingRequests.delete(cacheKey);
  }
}));
