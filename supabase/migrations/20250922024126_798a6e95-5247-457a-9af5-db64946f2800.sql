-- Add publish_date column to daily_published table (without constraint first)
ALTER TABLE public.daily_published 
ADD COLUMN IF NOT EXISTS publish_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update existing records to have unique publish dates
-- First, set active items to today
UPDATE public.daily_published 
SET publish_date = CURRENT_DATE
WHERE status = 'active';

-- Set expired items to yesterday  
UPDATE public.daily_published 
SET publish_date = CURRENT_DATE - INTERVAL '1 day'
WHERE status = 'expired';

-- For draft and queued items, spread them across future dates to avoid duplicates
WITH numbered_items AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) as rn
  FROM daily_published 
  WHERE status IN ('draft', 'queued')
)
UPDATE daily_published 
SET publish_date = CASE 
  WHEN status = 'queued' THEN CURRENT_DATE + (numbered_items.rn || ' days')::interval
  WHEN status = 'draft' THEN CURRENT_DATE + (numbered_items.rn + 100 || ' days')::interval  -- Push drafts far into future
  ELSE publish_date
END
FROM numbered_items 
WHERE daily_published.id = numbered_items.id;

-- Now add the unique constraint (only for active items per date)
ALTER TABLE public.daily_published 
ADD CONSTRAINT unique_active_per_date 
UNIQUE (publish_date) 
WHERE (status = 'active');

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_daily_published_publish_date_status 
ON public.daily_published (publish_date, status);

-- Create function to get next available publish date
CREATE OR REPLACE FUNCTION public.get_next_available_publish_date()
RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_date DATE;
BEGIN
  -- Start with tomorrow
  next_date := CURRENT_DATE + INTERVAL '1 day';
  
  -- Find the next date that doesn't have an active or queued item
  WHILE EXISTS (
    SELECT 1 FROM daily_published 
    WHERE publish_date = next_date 
    AND status IN ('active', 'queued')
  ) LOOP
    next_date := next_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN next_date;
END;
$$;

-- Create simplified daily publisher function
CREATE OR REPLACE FUNCTION public.process_simple_daily_publishing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  expired_count INTEGER := 0;
  activated_count INTEGER := 0;
  activated_item_id UUID;
  report jsonb;
BEGIN
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
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now(),
      'date_processed', today_date
    );
END;
$$;