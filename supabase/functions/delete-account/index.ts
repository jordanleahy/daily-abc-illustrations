import Stripe from "https://esm.sh/stripe@18.5.0";
import { createHandler } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

Deno.serve(createHandler({
  name: 'delete-account',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user }) => {
  const userId = user!.userId;
  const email = user!.email;

  console.log('[DELETE-ACCOUNT] User authenticated', { userId, email });

  // Step 1: Cancel Stripe subscription if exists
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && email) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email, limit: 1 });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        console.log('[DELETE-ACCOUNT] Found Stripe customer', { customerId });
        
        // Cancel all active subscriptions immediately
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
        });
        
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
          console.log('[DELETE-ACCOUNT] Cancelled Stripe subscription', { subscriptionId: subscription.id });
        }
        
        // NOTE: We intentionally DO NOT delete the Stripe customer record for:
        // 1. Legal/compliance requirements (payment history retention)
        // 2. Accounting/tax purposes (transaction records)
        // 3. Dispute resolution (chargeback handling)
        console.log('[DELETE-ACCOUNT] Stripe customer retained for compliance', { customerId });
      } else {
        console.log('[DELETE-ACCOUNT] No Stripe customer found');
      }
    }
  } catch (stripeError) {
    console.log('[DELETE-ACCOUNT] Error cancelling Stripe subscription', { 
      error: stripeError instanceof Error ? stripeError.message : String(stripeError) 
    });
    // Continue with deletion even if Stripe fails
  }

  // Step 2: Sign out all sessions before deletion
  console.log('[DELETE-ACCOUNT] Signing out all user sessions');
  try {
    const { error: signOutError } = await supabase.auth.admin.signOut(userId, 'global');
    if (signOutError) {
      console.log('[DELETE-ACCOUNT] Warning: Failed to sign out user sessions', { error: signOutError.message });
    } else {
      console.log('[DELETE-ACCOUNT] Successfully signed out all user sessions');
    }
  } catch (signOutError) {
    console.log('[DELETE-ACCOUNT] Error during session sign out', { 
      error: signOutError instanceof Error ? signOutError.message : String(signOutError) 
    });
  }

  // Step 3: Delete storage files
  const storageBuckets = ['kid-profile-images', 'kid-rewards-images', 'page-images', 'book-covers', 'exports'];
  
  for (const bucket of storageBuckets) {
    try {
      const { data: files, error: listError } = await supabase
        .storage
        .from(bucket)
        .list(userId);
      
      if (listError) {
        console.log(`[DELETE-ACCOUNT] Error listing files in ${bucket}`, { error: listError.message });
        continue;
      }

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase
          .storage
          .from(bucket)
          .remove(filePaths);
        
        if (deleteError) {
          console.log(`[DELETE-ACCOUNT] Error deleting files from ${bucket}`, { error: deleteError.message });
        } else {
          console.log(`[DELETE-ACCOUNT] Deleted ${files.length} files from ${bucket}`);
        }
      }
    } catch (bucketError) {
      console.log(`[DELETE-ACCOUNT] Error processing bucket ${bucket}`, { 
        error: bucketError instanceof Error ? bucketError.message : String(bucketError) 
      });
    }
  }

  // Step 4: Delete user from Supabase Auth (CASCADE will handle database records)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  
  if (deleteError) {
    console.log('[DELETE-ACCOUNT] Error deleting user', { error: deleteError.message });
    throw new Error(`Failed to delete user account: ${deleteError.message}`);
  }

  console.log('[DELETE-ACCOUNT] Account deleted successfully', { userId });

  return successResponse({ 
    success: true, 
    message: "Account deleted successfully" 
  });
}));
