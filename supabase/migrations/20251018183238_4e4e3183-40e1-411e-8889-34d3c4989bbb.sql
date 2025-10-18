-- Update admin_manually_activate_item function to properly coordinate with automated publisher
-- This ensures manually activated books are replaced at the next 7:01 AM ET publish cycle

CREATE OR REPLACE FUNCTION public.admin_manually_activate_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_active_item RECORD;
  target_item RECORD;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin role required'
    );
  END IF;

  -- Get the target item
  SELECT * INTO target_item 
  FROM public.daily_published 
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found'
    );
  END IF;

  -- Check if item is queued
  IF target_item.status != 'queued' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item is not in queued status'
    );
  END IF;

  -- Get current active item
  SELECT * INTO current_active_item
  FROM public.daily_published
  WHERE status = 'active' AND is_active = true
  LIMIT 1;

  -- Move current active item back to queue (if exists)
  IF FOUND THEN
    UPDATE public.daily_published
    SET 
      status = 'queued',
      is_active = false,
      publish_date = CURRENT_DATE + INTERVAL '1 day',
      updated_at = now()
    WHERE id = current_active_item.id;
  END IF;

  -- Activate the target item with expires_at set to tomorrow's 7:01 AM ET
  -- This ensures the automated publisher will expire it and activate the next queued book
  UPDATE public.daily_published
  SET 
    status = 'active',
    is_active = true,
    publish_date = CURRENT_DATE,
    published_at = now(),
    -- Set expires_at to tomorrow's 7:01 AM ET in UTC
    -- This coordinates with automated publisher to ensure replacement at next cycle
    expires_at = CASE 
      WHEN EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 day')) BETWEEN 3 AND 11 THEN 
        ((CURRENT_DATE + INTERVAL '1 day') + TIME '11:01:00') AT TIME ZONE 'UTC'
      ELSE 
        ((CURRENT_DATE + INTERVAL '1 day') + TIME '12:01:00') AT TIME ZONE 'UTC'
    END,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item activated successfully',
    'activated_item_id', p_item_id,
    'previous_active_item_id', current_active_item.id,
    'timestamp', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$function$;