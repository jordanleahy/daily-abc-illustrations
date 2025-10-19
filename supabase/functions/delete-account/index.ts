import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting account deletion process");

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user with validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    // Validate Authorization header format
    const AuthHeaderSchema = z.string().regex(/^Bearer .+$/, "Invalid authorization header format");
    const validatedHeader = AuthHeaderSchema.parse(authHeader);

    const token = validatedHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Step 1: Cancel Stripe subscription if exists
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          logStep("Found Stripe customer", { customerId });
          
          // Cancel all active subscriptions immediately
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
          });
          
          for (const subscription of subscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id);
            logStep("Cancelled Stripe subscription", { subscriptionId: subscription.id });
          }
          
          // NOTE: We intentionally DO NOT delete the Stripe customer record for:
          // 1. Legal/compliance requirements (payment history retention)
          // 2. Accounting/tax purposes (transaction records)
          // 3. Dispute resolution (chargeback handling)
          // The customer record will be retained with cancelled subscriptions.
          logStep("Stripe customer retained for compliance", { customerId });
        } else {
          logStep("No Stripe customer found");
        }
      }
    } catch (stripeError) {
      logStep("Error cancelling Stripe subscription", { error: stripeError.message });
      // Continue with deletion even if Stripe fails
    }

    // Step 2: Sign out all sessions before deletion
    logStep("Signing out all user sessions");
    try {
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.id, 'global');
      if (signOutError) {
        logStep("Warning: Failed to sign out user sessions", { error: signOutError.message });
        // Continue anyway - deletion will invalidate tokens
      } else {
        logStep("Successfully signed out all user sessions");
      }
    } catch (signOutError) {
      logStep("Error during session sign out", { error: signOutError.message });
      // Continue anyway
    }

    // Step 3: Delete storage files
    const storageBuckets = ['kid-profile-images', 'kid-rewards-images', 'page-images', 'book-covers', 'exports'];
    
    for (const bucket of storageBuckets) {
      try {
        const { data: files, error: listError } = await supabaseAdmin
          .storage
          .from(bucket)
          .list(user.id);
        
        if (listError) {
          logStep(`Error listing files in ${bucket}`, { error: listError.message });
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from(bucket)
            .remove(filePaths);
          
          if (deleteError) {
            logStep(`Error deleting files from ${bucket}`, { error: deleteError.message });
          } else {
            logStep(`Deleted ${files.length} files from ${bucket}`);
          }
        }
      } catch (bucketError) {
        logStep(`Error processing bucket ${bucket}`, { error: bucketError.message });
        // Continue with other buckets
      }
    }

    // Step 4: Delete user from Supabase Auth (CASCADE will handle database records)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      logStep("Error deleting user", { error: deleteError.message });
      throw new Error(`Failed to delete user account: ${deleteError.message}`);
    }

    logStep("Account deleted successfully", { userId: user.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-account", { message: errorMessage });
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input',
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
