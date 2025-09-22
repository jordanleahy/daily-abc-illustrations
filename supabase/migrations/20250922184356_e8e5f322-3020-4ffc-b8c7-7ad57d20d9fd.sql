-- Add separate date and time columns for more flexible scheduling
ALTER TABLE daily_published 
ADD COLUMN start_date DATE,
ADD COLUMN start_time TIME DEFAULT '07:01:00',
ADD COLUMN expire_date DATE, 
ADD COLUMN expire_time TIME DEFAULT '07:01:00';

-- Populate new columns from existing data
UPDATE daily_published 
SET 
  start_date = publish_date,
  start_time = CASE 
    WHEN published_at IS NOT NULL THEN 
      (published_at AT TIME ZONE 'America/New_York')::TIME
    ELSE '07:01:00'::TIME
  END,
  expire_date = CASE
    WHEN expires_at IS NOT NULL THEN
      (expires_at AT TIME ZONE 'America/New_York')::DATE
    ELSE publish_date + INTERVAL '1 day'
  END,
  expire_time = CASE
    WHEN expires_at IS NOT NULL THEN
      (expires_at AT TIME ZONE 'America/New_York')::TIME  
    ELSE '07:01:00'::TIME
  END;

-- Update the database function to use the new flexible date/time columns
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
  item_record RECORD;
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
  
  -- Step 1: Expire items that should be expired based on expire_date/expire_time
  UPDATE public.daily_published 
  SET 
    status = 'expired',
    is_active = false,
    updated_at = now()
  WHERE status = 'active' 
    AND (
      expire_date < today_date OR 
      (expire_date = today_date AND expire_time <= CURRENT_TIME)
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Step 2: Activate items scheduled for today that should be active now
  SELECT id, start_date, start_time, expire_date, expire_time INTO item_record
  FROM public.daily_published 
  WHERE status = 'queued' 
    AND start_date = today_date
    AND start_time <= CURRENT_TIME
  ORDER BY start_time ASC, created_at ASC
  LIMIT 1;
  
  IF item_record.id IS NOT NULL THEN
    activated_item_id := item_record.id;
    
    UPDATE public.daily_published 
    SET 
      status = 'active',
      is_active = true,
      -- Create published_at from start_date + start_time in Eastern Time, converted to UTC
      published_at = CASE 
        -- Check if we're in Daylight Saving Time (March to November roughly)
        WHEN EXTRACT(MONTH FROM item_record.start_date) BETWEEN 3 AND 11 THEN 
          ((item_record.start_date + item_record.start_time) - INTERVAL '4 hours')
        -- During Standard Time (December to February), EST is UTC-5
        ELSE 
          ((item_record.start_date + item_record.start_time) - INTERVAL '5 hours')
      END,
      -- Create expires_at from expire_date + expire_time in Eastern Time, converted to UTC  
      expires_at = CASE 
        WHEN EXTRACT(MONTH FROM item_record.expire_date) BETWEEN 3 AND 11 THEN 
          ((item_record.expire_date + item_record.expire_time) - INTERVAL '4 hours')
        ELSE 
          ((item_record.expire_date + item_record.expire_time) - INTERVAL '5 hours')
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