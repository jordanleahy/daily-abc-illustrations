import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    
    // Initialize Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Helper function to upsert subscription to database
    const upsertSubscription = async (subscription: Stripe.Subscription) => {
      try {
        // Get customer details
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

        // Get user by email
        const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
        const user = users?.find(u => u.email === customerEmail);
        
        if (!user) {
          logStep("User not found for email", { email: customerEmail });
          return;
        }

        // Upsert subscription record
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
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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
        
        // Update database to mark as canceled
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
        
        // Update database with latest subscription data
        await upsertSubscription(subscription);
        
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
              const canceledSub = await stripe.subscriptions.cancel(invoice.subscription as string);
              logStep("Subscription canceled due to refund", { subscriptionId: invoice.subscription });
              
              // Update database
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
