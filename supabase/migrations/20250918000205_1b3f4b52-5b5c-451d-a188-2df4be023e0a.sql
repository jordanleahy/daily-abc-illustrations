-- Fix search_path security issues for SEO metadata functions
CREATE OR REPLACE FUNCTION public.get_next_seo_version_number(p_daily_published_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.seo_metadata WHERE daily_published_id = p_daily_published_id),
    1
  );
END;
$$;

-- Fix search_path for handle_seo_metadata_version function
CREATE OR REPLACE FUNCTION public.handle_seo_metadata_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this daily_published_id
  IF NEW.is_latest = true THEN
    UPDATE public.seo_metadata 
    SET is_latest = false 
    WHERE daily_published_id = NEW.daily_published_id 
    AND id != NEW.id;
  END IF;
  
  -- Set optimized_at timestamp when status changes to complete
  IF NEW.optimization_status = 'complete' AND (OLD.optimization_status IS NULL OR OLD.optimization_status != 'complete') THEN
    NEW.optimized_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;