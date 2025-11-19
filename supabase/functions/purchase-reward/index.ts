import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user has active subscription (Plus tier required for rewards)
    const { data: hasAccess, error: accessError } = await supabase.rpc('has_feature_access', {
      p_user_id: user.id,
      p_feature: 'habits_rewards'
    });

    if (accessError || !hasAccess) {
      console.log('[PURCHASE-REWARD] User does not have access to rewards feature', { userId: user.id });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This feature requires an active Plus subscription. Please upgrade to use rewards.' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    const PurchaseRequestSchema = z.object({
      kidProfileId: z.string().uuid({ message: 'Invalid kid profile ID' }),
      productId: z.string().uuid({ message: 'Invalid product ID' })
    });
    
    const body = await req.json();
    const { kidProfileId, productId } = PurchaseRequestSchema.parse(body);

    console.log('[PURCHASE-REWARD] Starting purchase', { userId: user.id, kidProfileId, productId });

    // Start transaction by fetching all necessary data
    // 1. Get the kid profile and verify it belongs to the user
    const { data: kidProfile, error: kidError } = await supabase
      .from('kid_profiles')
      .select('id, parent_user_id, earned_coins, first_name, last_name')
      .eq('id', kidProfileId)
      .eq('parent_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (kidError || !kidProfile) {
      throw new Error('Kid profile not found or unauthorized');
    }

    console.log('[PURCHASE-REWARD] Kid profile verified', { 
      kidId: kidProfile.id, 
      currentCoins: kidProfile.earned_coins 
    });

    // 2. Get the product and verify it's active
    const { data: product, error: productError } = await supabase
      .from('kid_rewards_products')
      .select('*')
      .eq('id', productId)
      .eq('parent_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      throw new Error('Product not found or unavailable');
    }

    console.log('[PURCHASE-REWARD] Product verified', { 
      productId: product.id, 
      price: product.coin_price,
      quantityAvailable: product.quantity_available
    });

    // 3. Check if kid has enough coins
    if (kidProfile.earned_coins < product.coin_price) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient coins',
          currentCoins: kidProfile.earned_coins,
          requiredCoins: product.coin_price
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Check quantity available
    if (product.quantity_available !== null && product.quantity_available <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Product out of stock'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 5. Deduct coins from kid profile
    const newCoinBalance = kidProfile.earned_coins - product.coin_price;
    const { error: updateError } = await supabase
      .from('kid_profiles')
      .update({ earned_coins: newCoinBalance })
      .eq('id', kidProfileId);

    if (updateError) {
      console.error('[PURCHASE-REWARD] Failed to deduct coins', updateError);
      throw new Error('Failed to process purchase');
    }

    console.log('[PURCHASE-REWARD] Coins deducted', { 
      oldBalance: kidProfile.earned_coins,
      newBalance: newCoinBalance
    });

    // 6. Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('kid_purchases')
      .insert({
        kid_profile_id: kidProfileId,
        product_id: productId,
        parent_user_id: user.id,
        coins_spent: product.coin_price,
        purchase_status: 'pending'
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('[PURCHASE-REWARD] Failed to create purchase record', purchaseError);
      
      // Rollback: Add coins back
      await supabase
        .from('kid_profiles')
        .update({ earned_coins: kidProfile.earned_coins })
        .eq('id', kidProfileId);
      
      throw new Error('Failed to create purchase record');
    }

    console.log('[PURCHASE-REWARD] Purchase record created', { purchaseId: purchase.id });

    // 7. Optionally decrease quantity available
    if (product.quantity_available !== null) {
      const { error: quantityError } = await supabase
        .from('kid_rewards_products')
        .update({ quantity_available: product.quantity_available - 1 })
        .eq('id', productId);

      if (quantityError) {
        console.error('[PURCHASE-REWARD] Failed to update quantity', quantityError);
        // Continue anyway - purchase is already complete
      }
    }

    console.log('[PURCHASE-REWARD] Purchase completed successfully', {
      purchaseId: purchase.id,
      newBalance: newCoinBalance
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchase,
        newCoinBalance,
        kidName: `${kidProfile.first_name} ${kidProfile.last_name}`,
        productTitle: product.title
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[PURCHASE-REWARD] Error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input',
          details: error.errors 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
