-- Create comprehensive cleanup function for daily_published queue
CREATE OR REPLACE FUNCTION public.cleanup_daily_published_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  deactivated_count INTEGER := 0;
  inconsistency_count INTEGER := 0;
  resequenced_count INTEGER := 0;
  kept_active_item_id UUID;
  report jsonb;
BEGIN
  -- Step 1: Mark all expired items as expired and inactive
  UPDATE public.daily_published 
  SET 
    status = 'expired',
    is_active = false,
    updated_at = now()
  WHERE (expires_at IS NOT NULL AND expires_at < now())
    AND (status != 'expired' OR is_active = true);
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Step 2: Enforce single active rule - keep only the earliest queue_position active item
  -- First, find the item with earliest queue_position that should remain active
  SELECT id INTO kept_active_item_id
  FROM public.daily_published 
  WHERE status = 'active' 
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY queue_position ASC, created_at ASC
  LIMIT 1;
  
  -- Deactivate all other items that are currently active (except the one we're keeping)
  UPDATE public.daily_published 
  SET 
    status = 'queued',
    is_active = false,
    updated_at = now()
  WHERE status = 'active' 
    AND (kept_active_item_id IS NULL OR id != kept_active_item_id)
    AND (expires_at IS NULL OR expires_at > now());
  
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  -- Step 3: Fix status/is_active inconsistencies
  -- Ensure active items have is_active = true
  UPDATE public.daily_published 
  SET 
    is_active = true,
    updated_at = now()
  WHERE status = 'active' AND is_active = false;
  
  -- Ensure non-active items have is_active = false  
  UPDATE public.daily_published 
  SET 
    is_active = false,
    updated_at = now()
  WHERE status IN ('queued', 'expired', 'draft') AND is_active = true;
  
  GET DIAGNOSTICS inconsistency_count = ROW_COUNT;
  
  -- Step 4: Resequence queue positions for non-expired items
  -- Create a temporary sequence for active and queued items only
  WITH resequenced AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY 
        CASE 
          WHEN status = 'active' THEN 1 
          WHEN status = 'queued' THEN 2 
          ELSE 3 
        END,
        queue_position ASC, 
        created_at ASC
      ) as new_position
    FROM public.daily_published 
    WHERE status IN ('active', 'queued')
      AND (expires_at IS NULL OR expires_at > now())
  )
  UPDATE public.daily_published 
  SET 
    queue_position = resequenced.new_position,
    updated_at = now()
  FROM resequenced 
  WHERE daily_published.id = resequenced.id 
    AND daily_published.queue_position != resequenced.new_position;
  
  GET DIAGNOSTICS resequenced_count = ROW_COUNT;
  
  -- Create detailed report
  report := jsonb_build_object(
    'success', true,
    'timestamp', now(),
    'changes', jsonb_build_object(
      'expired_items', expired_count,
      'deactivated_items', deactivated_count, 
      'inconsistencies_fixed', inconsistency_count,
      'positions_resequenced', resequenced_count,
      'kept_active_item_id', kept_active_item_id
    ),
    'current_state', (
      SELECT jsonb_build_object(
        'total_items', COUNT(*),
        'active_items', COUNT(*) FILTER (WHERE status = 'active'),
        'queued_items', COUNT(*) FILTER (WHERE status = 'queued'),
        'expired_items', COUNT(*) FILTER (WHERE status = 'expired'),
        'draft_items', COUNT(*) FILTER (WHERE status = 'draft')
      )
      FROM public.daily_published
    )
  );
  
  RETURN report;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$function$;

-- Run the cleanup function immediately to fix current issues
SELECT public.cleanup_daily_published_queue();