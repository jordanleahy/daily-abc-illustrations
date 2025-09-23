-- Fix the process_enhanced_daily_publishing function to calculate expiration based on actual activation date
CREATE OR REPLACE FUNCTION public.process_enhanced_daily_publishing()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  expired_count INTEGER := 0;
  activated_count INTEGER := 0;
  activated_item_id UUID;
  status_record RECORD;
  report jsonb;
BEGIN
  -- Check if we've already processed today (safety check)
  SELECT * INTO status_record 
  FROM public.daily_publishing_status 
  WHERE processing_date = today_date 
  AND status IN ('processing', 'completed');
  
  -- If already processing or completed, return early
  IF status_record.id IS NOT NULL THEN
    IF status_record.status = 'processing' THEN
      -- Check if it's been processing for more than 10 minutes (assume stale)
      IF status_record.started_at < (now() - INTERVAL '10 minutes') THEN
        -- Mark as failed and continue
        UPDATE public.daily_publishing_status 
        SET status = 'failed', 
            error_message = 'Processing timeout - restarting',
            updated_at = now()
        WHERE id = status_record.id;
      ELSE
        -- Still actively processing, return early
        RETURN jsonb_build_object(
          'success', true,
          'message', 'Already processing',
          'timestamp', now(),
          'date_processed', today_date,
          'status', 'already_processing'
        );
      END IF;
    ELSIF status_record.status = 'completed' THEN
      -- Already completed today
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Already completed today',
        'timestamp', now(),
        'date_processed', today_date,
        'status', 'already_completed'
      );
    END IF;
  END IF;
  
  -- Create or update processing status record (this acts as our lock)
  INSERT INTO public.daily_publishing_status (processing_date, status)
  VALUES (today_date, 'processing')
  ON CONFLICT (processing_date) 
  DO UPDATE SET 
    status = 'processing',
    started_at = now(),
    error_message = NULL,
    updated_at = now();
  
  -- Step 1: Expire yesterday's active items
  UPDATE public.daily_published 
  SET 
    status = 'expired',
    is_active = false,
    updated_at = now()
  WHERE status = 'active' 
    AND publish_date < today_date;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Step 2: Activate the next queued item (lowest queue_order)
  SELECT id INTO activated_item_id
  FROM public.daily_published 
  WHERE status = 'queued'
  ORDER BY queue_order ASC NULLS LAST, created_at ASC
  LIMIT 1;
  
  IF activated_item_id IS NOT NULL THEN
    UPDATE public.daily_published 
    SET 
      status = 'active',
      is_active = true,
      -- Update publish_date to match actual activation date
      publish_date = today_date,
      -- Set published_at to 7:01 AM Eastern Time converted to UTC
      published_at = CASE 
        -- Check if we're in Daylight Saving Time (March to November roughly)
        WHEN EXTRACT(MONTH FROM today_date) BETWEEN 3 AND 11 THEN 
          (today_date + TIME '11:01:00') AT TIME ZONE 'UTC'
        -- During Standard Time (December to February), EST is UTC-5
        ELSE 
          (today_date + TIME '12:01:00') AT TIME ZONE 'UTC'
      END,
      -- Set expires_at to 7:01 AM Eastern Time tomorrow based on TODAY'S date (exactly 24 hours later)
      expires_at = CASE 
        WHEN EXTRACT(MONTH FROM (today_date + INTERVAL '1 day')) BETWEEN 3 AND 11 THEN 
          ((today_date + INTERVAL '1 day') + TIME '11:01:00') AT TIME ZONE 'UTC'
        ELSE 
          ((today_date + INTERVAL '1 day') + TIME '12:01:00') AT TIME ZONE 'UTC'
      END,
      updated_at = now()
    WHERE id = activated_item_id;
    
    activated_count := 1;
  END IF;
  
  -- Mark processing as completed
  UPDATE public.daily_publishing_status 
  SET status = 'completed', 
      completed_at = now(),
      updated_at = now()
  WHERE processing_date = today_date;
  
  -- Create report
  report := jsonb_build_object(
    'success', true,
    'timestamp', now(),
    'date_processed', today_date,
    'changes', jsonb_build_object(
      'expired_items', expired_count,
      'activated_items', activated_count,
      'activated_item_id', activated_item_id
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
    -- Mark processing as failed
    UPDATE public.daily_publishing_status 
    SET status = 'failed', 
        error_message = SQLERRM,
        updated_at = now()
    WHERE processing_date = today_date;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now(),
      'date_processed', today_date
    );
END;
$function$;

-- Create admin function to manually adjust expiration times
CREATE OR REPLACE FUNCTION public.admin_update_daily_published_expiration(
  p_daily_published_id UUID,
  p_new_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin role required'
    );
  END IF;
  
  -- Update the expiration time
  UPDATE public.daily_published 
  SET 
    expires_at = p_new_expires_at,
    updated_at = now()
  WHERE id = p_daily_published_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily published item not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expiration time updated successfully',
    'daily_published_id', p_daily_published_id,
    'new_expires_at', p_new_expires_at,
    'updated_at', now()
  );
END;
$function$;