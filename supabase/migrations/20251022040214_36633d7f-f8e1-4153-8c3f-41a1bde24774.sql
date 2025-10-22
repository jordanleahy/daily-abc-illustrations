-- CRITICAL: Fix child data privacy and storage security issues
-- Make kid-profile-images bucket private (child safety compliance)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'kid-profile-images';

-- Make exports bucket private (user data protection)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'exports';

-- Fix SECURITY DEFINER functions - add SET search_path protection
-- This prevents SQL injection and search path poisoning attacks

-- 1. Fix handle_page_image_version
DROP FUNCTION IF EXISTS public.handle_page_image_version() CASCADE;
CREATE FUNCTION public.handle_page_image_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    UPDATE public.page_image_urls 
    SET is_latest = false 
    WHERE page_id = NEW.page_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_page_image_version
BEFORE INSERT OR UPDATE OF is_latest ON public.page_image_urls
FOR EACH ROW
EXECUTE FUNCTION public.handle_page_image_version();

-- 2. Fix handle_gemini_image_version
DROP FUNCTION IF EXISTS public.handle_gemini_image_version() CASCADE;
CREATE FUNCTION public.handle_gemini_image_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    UPDATE public.gemini_page_images 
    SET is_latest = false 
    WHERE page_id = NEW.page_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_gemini_image_version
BEFORE INSERT OR UPDATE OF is_latest ON public.gemini_page_images
FOR EACH ROW
EXECUTE FUNCTION public.handle_gemini_image_version();

-- 3. Fix handle_simplified_prompt_version (CORRECT TABLE NAME)
DROP FUNCTION IF EXISTS public.handle_simplified_prompt_version() CASCADE;
CREATE FUNCTION public.handle_simplified_prompt_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    UPDATE public.page_simplified_prompts 
    SET is_latest = false 
    WHERE page_id = NEW.page_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_simplified_prompt_version
BEFORE INSERT OR UPDATE OF is_latest ON public.page_simplified_prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_simplified_prompt_version();

-- 4. Fix manage_page_image_latest
DROP FUNCTION IF EXISTS public.manage_page_image_latest() CASCADE;
CREATE FUNCTION public.manage_page_image_latest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    UPDATE public.page_image_urls
    SET is_latest = false
    WHERE page_id = NEW.page_id 
      AND id != NEW.id 
      AND is_latest = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_page_image_latest_trigger
BEFORE INSERT OR UPDATE OF is_latest ON public.page_image_urls
FOR EACH ROW
WHEN (NEW.is_latest = true)
EXECUTE FUNCTION public.manage_page_image_latest();

-- Add comments documenting the security improvements
COMMENT ON FUNCTION public.handle_page_image_version() IS 'SECURITY DEFINER with search_path protection against SQL injection';
COMMENT ON FUNCTION public.handle_gemini_image_version() IS 'SECURITY DEFINER with search_path protection against SQL injection';
COMMENT ON FUNCTION public.handle_simplified_prompt_version() IS 'SECURITY DEFINER with search_path protection against SQL injection';
COMMENT ON FUNCTION public.manage_page_image_latest() IS 'SECURITY DEFINER with search_path protection against SQL injection';