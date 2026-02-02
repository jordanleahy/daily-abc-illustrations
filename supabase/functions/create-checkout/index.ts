import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errorResponse, errors } from '../_shared/response.ts';

const CheckoutRequestSchema = z.object({
  price_id: z.string().optional(),
  product_id: z.string().optional(),
  plan_type: z.enum(['monthly', 'annual', 'max']).optional(),
  coupon_code: z.string().optional()
}).refine(
  (data) => data.price_id || data.product_id || data.plan_type,
  { message: "At least one of price_id, product_id, or plan_type must be provided" }
);

const PRODUCT_MAP: Record<string, string> = {
  monthly: "prod_T7a3qkxm69uttK",
  annual: "prod_T7a5vTweAt6UZm",
  max: "prod_TuK1PC63uRuok9",
};

Deno.serve(createHandler({
  name: 'create-checkout',
  clientMode: 'public', // Uses user auth but doesn't need service role
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

  const email = user!.email;
  if (!email) {
    return errors.unauthorized('Email not available');
  }

  // Get and validate checkout params
  const body = await parseBody<unknown>(req);
  
  let parsedData;
  try {
    parsedData = CheckoutRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input', 400, { details: error.errors });
    }
    throw error;
  }

  const { price_id, product_id, plan_type, coupon_code } = parsedData;
  console.log('[CREATE-CHECKOUT] Request data received', { price_id, product_id, plan_type, coupon_code });

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  // Resolve to an active price ID before creating the session
  let resolvedPriceId: string | undefined = price_id;
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
    console.log('[CREATE-CHECKOUT] Resolved active price', { resolvedPriceId, targetProductId });
  };

  await resolveActivePrice();
  
  // Check if customer exists
  const customers = await stripe.customers.list({ email, limit: 1 });
  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
    console.log('[CREATE-CHECKOUT] Found existing customer', { customerId });
  } else {
    console.log('[CREATE-CHECKOUT] No existing customer found');
  }

  const origin = req.headers.get("origin") || "https://dailyabcillustrations.com";
  
  // Determine if this is a subscription or one-time payment by checking the price
  const priceDetails = await stripe.prices.retrieve(resolvedPriceId!);
  const isSubscription = priceDetails.type === 'recurring';
  console.log('[CREATE-CHECKOUT] Price type', { priceId: resolvedPriceId, type: priceDetails.type, isSubscription });
  
  // Prepare checkout session configuration
  const sessionConfig: any = {
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price: resolvedPriceId!,
        quantity: 1,
      },
    ],
    mode: isSubscription ? "subscription" : "payment",
    success_url: isSubscription 
      ? `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/subscription/cancel`,
    metadata: {
      user_id: user!.userId,
    },
  };

  // If a coupon code is provided, apply it directly
  if (coupon_code) {
    try {
      const coupons = await stripe.coupons.list({ limit: 100 });
      const matchingCoupon = coupons.data.find(
        c => c.name?.toLowerCase() === coupon_code.toLowerCase() || c.id.toLowerCase() === coupon_code.toLowerCase()
      );
      
      if (matchingCoupon && matchingCoupon.valid) {
        sessionConfig.discounts = [{ coupon: matchingCoupon.id }];
        console.log('[CREATE-CHECKOUT] Applied coupon', { coupon_code, coupon_id: matchingCoupon.id });
      } else {
        console.log('[CREATE-CHECKOUT] Coupon not found or invalid', { coupon_code });
        sessionConfig.allow_promotion_codes = true;
      }
    } catch (couponError) {
      console.log('[CREATE-CHECKOUT] Error looking up coupon', { error: couponError });
      sessionConfig.allow_promotion_codes = true;
    }
  } else {
    sessionConfig.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  console.log('[CREATE-CHECKOUT] Checkout session created', { sessionId: session.id, url: session.url });

  return successResponse({ url: session.url });
}));
