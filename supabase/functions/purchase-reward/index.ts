import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errorResponse, errors } from '../_shared/response.ts';

const PurchaseRequestSchema = z.object({
  kidProfileId: z.string().uuid({ message: 'Invalid kid profile ID' }),
  productId: z.string().uuid({ message: 'Invalid product ID' })
});

Deno.serve(createHandler({
  name: 'purchase-reward',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  // Parse and validate request body
  const body = await parseBody<unknown>(req);
  
  let kidProfileId: string;
  let productId: string;
  
  try {
    const parsed = PurchaseRequestSchema.parse(body);
    kidProfileId = parsed.kidProfileId;
    productId = parsed.productId;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input', 400, { details: error.errors });
    }
    throw error;
  }

  console.log('[PURCHASE-REWARD] Starting purchase', { 
    userId: user!.userId, 
    kidProfileId, 
    productId 
  });

  // 1. Get the kid profile and verify it belongs to the user
  const { data: kidProfile, error: kidError } = await supabase
    .from('kid_profiles')
    .select('id, parent_user_id, earned_coins, first_name, last_name')
    .eq('id', kidProfileId)
    .eq('parent_user_id', user!.userId)
    .eq('is_active', true)
    .single();

  if (kidError || !kidProfile) {
    return errors.notFound('Kid profile not found or unauthorized');
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
    .eq('parent_user_id', user!.userId)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    return errors.notFound('Product not found or unavailable');
  }

  console.log('[PURCHASE-REWARD] Product verified', { 
    productId: product.id, 
    price: product.coin_price,
    quantityAvailable: product.quantity_available
  });

  // 3. Check if kid has enough coins
  if (kidProfile.earned_coins < product.coin_price) {
    return errorResponse('Insufficient coins', 400, {
      success: false,
      currentCoins: kidProfile.earned_coins,
      requiredCoins: product.coin_price
    });
  }

  // 4. Check quantity available
  if (product.quantity_available !== null && product.quantity_available <= 0) {
    return errorResponse('Product out of stock', 400, { success: false });
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
      parent_user_id: user!.userId,
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

  // 7. Check if this is a screen time product and add screen time
  if (product.screen_time_minutes && product.screen_time_minutes > 0) {
    const secondsToAdd = product.screen_time_minutes * 60;
    
    console.log('[PURCHASE-REWARD] Adding screen time', { 
      kidId: kidProfile.id, 
      minutes: product.screen_time_minutes,
      seconds: secondsToAdd 
    });
    
    // Use atomic RPC function to add screen time
    const { data: newBalance, error: screenTimeError } = await supabase
      .rpc('increment_screen_time', {
        p_kid_id: kidProfileId,
        p_seconds: secondsToAdd
      });
      
    if (screenTimeError) {
      console.error('[PURCHASE-REWARD] Failed to add screen time', screenTimeError);
      throw new Error('Failed to add screen time');
    }
    
    console.log('[PURCHASE-REWARD] Screen time added', { 
      newBalance,
      balanceInMinutes: Math.floor(newBalance / 60)
    });
    
    // Mark purchase as fulfilled for screen time products
    const { error: fulfillError } = await supabase
      .from('kid_purchases')
      .update({ 
        purchase_status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', purchase.id);
      
    if (fulfillError) {
      console.error('[PURCHASE-REWARD] Failed to mark purchase as fulfilled', fulfillError);
    }
  }

  // 8. Optionally decrease quantity available
  if (product.quantity_available !== null) {
    const { error: quantityError } = await supabase
      .from('kid_rewards_products')
      .update({ quantity_available: product.quantity_available - 1 })
      .eq('id', productId);

    if (quantityError) {
      console.error('[PURCHASE-REWARD] Failed to update quantity', quantityError);
    }
  }

  console.log('[PURCHASE-REWARD] Purchase completed successfully', {
    purchaseId: purchase.id,
    newBalance: newCoinBalance
  });

  return successResponse({
    success: true,
    purchase,
    newCoinBalance,
    kidName: `${kidProfile.first_name} ${kidProfile.last_name}`,
    productTitle: product.title
  });
}));
