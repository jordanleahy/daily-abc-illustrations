import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errorResponse, errors } from '../_shared/response.ts';

const UpdateRenewalSchema = z.object({
  auto_renew: z.boolean({ 
    required_error: "auto_renew is required",
    invalid_type_error: "auto_renew must be a boolean value" 
  })
});

Deno.serve(createHandler({
  name: 'update-subscription-renewal',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

  const email = user!.email;
  if (!email) {
    return errors.unauthorized('Email not available');
  }

  // Parse and validate request body
  const body = await parseBody<unknown>(req);
  
  let auto_renew: boolean;
  try {
    const parsed = UpdateRenewalSchema.parse(body);
    auto_renew = parsed.auto_renew;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input', 400, { details: error.errors });
    }
    throw error;
  }

  console.log('[UPDATE-SUBSCRIPTION-RENEWAL] Request parsed', { auto_renew });

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  // Find the customer
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) {
    return errors.notFound('No Stripe customer found for this user');
  }
  const customerId = customers.data[0].id;
  console.log('[UPDATE-SUBSCRIPTION-RENEWAL] Found Stripe customer', { customerId });

  // Find active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return errors.notFound('No active subscription found');
  }

  const subscription = subscriptions.data[0];
  console.log('[UPDATE-SUBSCRIPTION-RENEWAL] Found active subscription', { subscriptionId: subscription.id });

  // Update the subscription's cancel_at_period_end setting
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: !auto_renew,
  });

  console.log('[UPDATE-SUBSCRIPTION-RENEWAL] Subscription updated successfully', {
    subscriptionId: updatedSubscription.id,
    cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    current_period_end: updatedSubscription.current_period_end,
  });

  return successResponse({
    success: true,
    cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    subscription_end: updatedSubscription.current_period_end 
      ? new Date(updatedSubscription.current_period_end * 1000).toISOString() 
      : null,
  });
}));
