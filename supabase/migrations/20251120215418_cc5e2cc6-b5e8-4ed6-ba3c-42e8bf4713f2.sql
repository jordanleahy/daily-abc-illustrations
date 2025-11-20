-- Create RPC function to safely auto-purchase screen time from coins
CREATE OR REPLACE FUNCTION public.auto_purchase_screen_time(
  p_kid_id UUID,
  p_required_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_kid_profile RECORD;
  v_product RECORD;
  v_current_balance INTEGER;
  v_seconds_per_product INTEGER;
  v_coins_per_product INTEGER;
  v_products_needed INTEGER;
  v_total_coins_needed INTEGER;
  v_total_seconds_to_add INTEGER;
  v_new_coin_balance INTEGER;
  v_new_screen_time_balance INTEGER;
  v_purchase_id UUID;
BEGIN
  -- Get kid profile with current coins and screen time
  SELECT 
    id, 
    parent_user_id, 
    earned_coins, 
    screen_time_balance_seconds,
    first_name,
    last_name
  INTO v_kid_profile
  FROM kid_profiles
  WHERE id = p_kid_id
    AND is_active = true;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kid profile not found'
    );
  END IF;
  
  v_current_balance := COALESCE(v_kid_profile.screen_time_balance_seconds, 0);
  
  -- Check if they already have enough screen time
  IF v_current_balance >= p_required_seconds THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Sufficient screen time available',
      'screen_time_balance_seconds', v_current_balance,
      'coins_spent', 0
    );
  END IF;
  
  -- Get the Screen Time product (system product)
  SELECT *
  INTO v_product
  FROM kid_rewards_products
  WHERE parent_user_id = v_kid_profile.parent_user_id
    AND title = 'Screen Time'
    AND is_active = true
    AND screen_time_minutes IS NOT NULL
    AND screen_time_minutes > 0
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Screen Time product not configured'
    );
  END IF;
  
  -- Calculate how much we need to purchase
  v_seconds_per_product := v_product.screen_time_minutes * 60;
  v_coins_per_product := v_product.coin_price;
  
  -- Calculate needed seconds (subtract current balance)
  v_total_seconds_to_add := p_required_seconds - v_current_balance;
  
  -- Round up to nearest product unit
  v_products_needed := CEIL(v_total_seconds_to_add::DECIMAL / v_seconds_per_product::DECIMAL)::INTEGER;
  v_total_coins_needed := v_products_needed * v_coins_per_product;
  v_total_seconds_to_add := v_products_needed * v_seconds_per_product;
  
  -- Check if kid has enough coins
  IF v_kid_profile.earned_coins < v_total_coins_needed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient coins',
      'current_coins', v_kid_profile.earned_coins,
      'required_coins', v_total_coins_needed,
      'products_needed', v_products_needed
    );
  END IF;
  
  -- Deduct coins and add screen time atomically
  UPDATE kid_profiles
  SET 
    earned_coins = earned_coins - v_total_coins_needed,
    screen_time_balance_seconds = COALESCE(screen_time_balance_seconds, 0) + v_total_seconds_to_add,
    updated_at = NOW()
  WHERE id = p_kid_id
  RETURNING earned_coins, screen_time_balance_seconds 
  INTO v_new_coin_balance, v_new_screen_time_balance;
  
  -- Create purchase record for audit trail
  INSERT INTO kid_purchases (
    kid_profile_id,
    product_id,
    parent_user_id,
    coins_spent,
    purchase_status,
    fulfilled_at,
    notes
  ) VALUES (
    p_kid_id,
    v_product.id,
    v_kid_profile.parent_user_id,
    v_total_coins_needed,
    'fulfilled',
    NOW(),
    format('Auto-purchased %s minutes (%s units) of screen time', 
           v_products_needed * v_product.screen_time_minutes,
           v_products_needed)
  )
  RETURNING id INTO v_purchase_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Auto-purchased %s minutes of screen time', v_products_needed * v_product.screen_time_minutes),
    'purchase_id', v_purchase_id,
    'products_purchased', v_products_needed,
    'coins_spent', v_total_coins_needed,
    'seconds_added', v_total_seconds_to_add,
    'new_coin_balance', v_new_coin_balance,
    'new_screen_time_balance', v_new_screen_time_balance,
    'kid_name', v_kid_profile.first_name || ' ' || v_kid_profile.last_name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_purchase_screen_time TO authenticated;