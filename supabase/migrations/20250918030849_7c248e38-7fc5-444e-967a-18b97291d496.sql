-- Fix search path security warnings for functions I just created
CREATE OR REPLACE FUNCTION public.get_next_queue_position()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(queue_position) + 1 FROM public.daily_published),
    1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_next_activation_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  last_published TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the most recent publication time
  SELECT published_at INTO last_published
  FROM public.daily_published 
  WHERE status = 'active'
  ORDER BY published_at DESC 
  LIMIT 1;
  
  -- If no active publication, return now
  IF last_published IS NULL THEN
    RETURN now();
  END IF;
  
  -- Return 48 hours after last publication
  RETURN last_published + INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.process_daily_published_queue()
RETURNS VOID AS $$
DECLARE
  next_activation_time TIMESTAMP WITH TIME ZONE;
  next_item_id UUID;
BEGIN
  -- Mark expired items
  UPDATE public.daily_published 
  SET status = 'expired', is_active = false
  WHERE status = 'active' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();
  
  -- Get next activation time
  SELECT public.get_next_activation_time() INTO next_activation_time;
  
  -- Check if it's time to activate the next item
  IF next_activation_time <= now() THEN
    -- Get the next queued item
    SELECT id INTO next_item_id
    FROM public.daily_published 
    WHERE status = 'queued'
    ORDER BY queue_position ASC
    LIMIT 1;
    
    -- Activate the next item if one exists
    IF next_item_id IS NOT NULL THEN
      UPDATE public.daily_published 
      SET 
        status = 'active',
        is_active = true,
        published_at = now(),
        expires_at = now() + INTERVAL '48 hours'
      WHERE id = next_item_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_daily_published_queue_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set queue position if not provided
  IF NEW.queue_position IS NULL THEN
    NEW.queue_position = public.get_next_queue_position();
  END IF;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status = 'queued';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;