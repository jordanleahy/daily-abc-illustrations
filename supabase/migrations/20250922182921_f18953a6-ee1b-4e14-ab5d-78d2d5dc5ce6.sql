-- Add a table to track daily publishing status and prevent race conditions
CREATE TABLE IF NOT EXISTS public.daily_publishing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_publishing_status ENABLE ROW LEVEL SECURITY;

-- Create policies (admin/moderator access only)
CREATE POLICY "Admins and moderators can view publishing status" 
ON public.daily_publishing_status 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "System can manage publishing status" 
ON public.daily_publishing_status 
FOR ALL 
USING (auth.uid() IS NULL OR auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_daily_publishing_status_updated_at
BEFORE UPDATE ON public.daily_publishing_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced version of the daily publishing function with safety measures
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
  
  -- Step 2: Activate today's queued item
  SELECT id INTO activated_item_id
  FROM public.daily_published 
  WHERE status = 'queued' 
    AND publish_date = today_date
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF activated_item_id IS NOT NULL THEN
    UPDATE public.daily_published 
    SET 
      status = 'active',
      is_active = true,
      published_at = now(),
      expires_at = (today_date + INTERVAL '1 day')::timestamp with time zone,
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