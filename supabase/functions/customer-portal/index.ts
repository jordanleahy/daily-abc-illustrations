import Stripe from "https://esm.sh/stripe@18.5.0";
import { createHandler } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

Deno.serve(createHandler({
  name: 'customer-portal',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const email = user!.email;
  
  if (!email) {
    return errors.unauthorized('Email not available');
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  console.log('[CUSTOMER-PORTAL] Stripe key verified');

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const customers = await stripe.customers.list({ email, limit: 1 });
  
  if (customers.data.length === 0) {
    return errors.notFound("No Stripe customer found for this user");
  }
  
  const customerId = customers.data[0].id;
  console.log('[CUSTOMER-PORTAL] Found Stripe customer', { customerId });

  const origin = req.headers.get("origin") || "https://dailyabcillustrations.com";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/`,
  });
  
  console.log('[CUSTOMER-PORTAL] Customer portal session created', { 
    sessionId: portalSession.id, 
    url: portalSession.url 
  });

  return successResponse({ url: portalSession.url });
}));
