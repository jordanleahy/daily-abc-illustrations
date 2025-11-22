-- Create function to seed Screen Time product for a parent
CREATE OR REPLACE FUNCTION public.seed_screen_time_product(p_parent_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product_id uuid;
BEGIN
  -- Check if parent already has a Screen Time product
  IF EXISTS (
    SELECT 1 FROM kid_rewards_products 
    WHERE parent_user_id = p_parent_user_id 
    AND is_system_product = true
    AND title = 'Screen Time'
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Screen Time product already exists',
      'action', 'none'
    );
  END IF;
  
  -- Create Screen Time product with default values
  INSERT INTO kid_rewards_products (
    parent_user_id,
    title,
    description,
    coin_price,
    screen_time_minutes,
    is_system_product,
    is_active
  ) VALUES (
    p_parent_user_id,
    'Screen Time',
    'Earn screen time to watch your favorite videos',
    100,
    5,
    true,
    true
  )
  RETURNING id INTO v_product_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Screen Time product created successfully',
    'product_id', v_product_id,
    'action', 'created'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Create trigger function to auto-seed Screen Time product
CREATE OR REPLACE FUNCTION public.auto_seed_screen_time_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call seed function for the parent (will check if already exists)
  PERFORM public.seed_screen_time_product(NEW.parent_user_id);
  RETURN NEW;
END;
$function$;

-- Create trigger on kid_profiles to auto-create Screen Time product
DROP TRIGGER IF EXISTS trigger_auto_seed_screen_time ON kid_profiles;
CREATE TRIGGER trigger_auto_seed_screen_time
  AFTER INSERT ON kid_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_seed_screen_time_product();

-- Backfill: Create Screen Time product for all existing parents who don't have one
DO $$
DECLARE
  v_parent_record RECORD;
  v_result jsonb;
  v_total_created integer := 0;
BEGIN
  -- Find all parents with kid profiles but no Screen Time product
  FOR v_parent_record IN
    SELECT DISTINCT kp.parent_user_id
    FROM kid_profiles kp
    WHERE kp.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM kid_rewards_products krp
      WHERE krp.parent_user_id = kp.parent_user_id
      AND krp.is_system_product = true
      AND krp.title = 'Screen Time'
    )
  LOOP
    -- Create Screen Time product for this parent
    SELECT public.seed_screen_time_product(v_parent_record.parent_user_id) INTO v_result;
    
    -- Count if we actually created one
    IF (v_result->>'action') = 'created' THEN
      v_total_created := v_total_created + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete: Created Screen Time products for % parents', v_total_created;
END $$;