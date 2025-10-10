import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.deleted':
        logStep("Subscription deleted", { subscriptionId: event.data.object.id });
        // Subscription was canceled or deleted
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        
        // Check if subscription was canceled (cancel_at_period_end = true) or reactivated
        if (subscription.cancel_at_period_end) {
          logStep("Subscription set to cancel at period end");
        }
        break;

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          customer: charge.customer
        });
        
        // When a charge is refunded, check if this was part of a subscription
        if (charge.invoice) {
          // Get the invoice to find the subscription
          const invoice = await stripe.invoices.retrieve(charge.invoice as string);
          if (invoice.subscription) {
            logStep("Refund was for subscription", { subscriptionId: invoice.subscription });
            
            // Cancel the subscription immediately when refunded
            try {
              await stripe.subscriptions.cancel(invoice.subscription as string);
              logStep("Subscription canceled due to refund", { subscriptionId: invoice.subscription });
            } catch (cancelError) {
              logStep("Error canceling subscription", { error: cancelError.message });
            }
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", {
          invoiceId: failedInvoice.id,
          subscriptionId: failedInvoice.subscription,
          customer: failedInvoice.customer
        });
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Return a success response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true, type: event.type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
