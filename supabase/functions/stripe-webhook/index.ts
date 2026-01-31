import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse, corsResponse } from '../_shared/response.ts';
import Stripe from "https://esm.sh/stripe@18.5.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Webhook needs raw body access for signature verification, so we handle it directly
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const upsertSubscription = async (subscription: Stripe.Subscription) => {
      try {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer || customer.deleted) {
          logStep("Customer not found or deleted", { customerId: subscription.customer });
          return;
        }
        
        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("No email for customer", { customerId: subscription.customer });
          return;
        }

        const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
        const user = users?.find(u => u.email === customerEmail);
        
        if (!user) {
          logStep("User not found for email", { email: customerEmail });
          return;
        }

        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_product_id: subscription.items.data[0]?.price.product as string,
            stripe_price_id: subscription.items.data[0]?.price.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription upserted to database", { subscriptionId: subscription.id, userId: user.id });
        }
      } catch (error) {
        logStep("Error in upsertSubscription", { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header found");

    const body = await req.text();
    
    logStep("Verifying webhook signature with constructEventAsync");
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return errorResponse(`Webhook signature verification failed: ${err.message}`, 400);
    }

    switch (event.type) {
      case 'customer.subscription.created':
        const createdSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", {
          subscriptionId: createdSubscription.id,
          status: createdSubscription.status,
          customerId: createdSubscription.customer
        });
        await upsertSubscription(createdSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: deletedSubscription.id });
        
        try {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({ 
              status: 'canceled', 
              updated_at: new Date().toISOString() 
            })
            .eq('stripe_subscription_id', deletedSubscription.id);
          
          if (error) {
            logStep("Error updating deleted subscription in database", { error: error.message });
          } else {
            logStep("Subscription marked as canceled in database");
          }
        } catch (dbError) {
          logStep("Database error on subscription deletion", { 
            error: dbError instanceof Error ? dbError.message : String(dbError) 
          });
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        
        await upsertSubscription(subscription);
        
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
        
        if (charge.invoice) {
          const invoice = await stripe.invoices.retrieve(charge.invoice as string);
          if (invoice.subscription) {
            logStep("Refund was for subscription", { subscriptionId: invoice.subscription });
            
            try {
              const canceledSub = await stripe.subscriptions.cancel(invoice.subscription as string);
              logStep("Subscription canceled due to refund", { subscriptionId: invoice.subscription });
              await upsertSubscription(canceledSub);
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

    return successResponse({ received: true, type: event.type });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return errorResponse(errorMessage, 500);
  }
});
