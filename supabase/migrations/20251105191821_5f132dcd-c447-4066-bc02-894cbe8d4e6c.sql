-- Fix security warning: Add search_path to functions missing it
-- This prevents schema injection attacks

-- 1. Fix update_habits_updated_at function
CREATE OR REPLACE FUNCTION public.update_habits_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fix get_next_page_image_version_number function
CREATE OR REPLACE FUNCTION public.get_next_page_image_version_number(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM page_image_urls
  WHERE page_id = p_page_id;
  
  RETURN next_version;
END;
$function$;

-- 3. Fix generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Truncate to 60 characters
  base_slug := substring(base_slug from 1 for 60);
  base_slug := trim(both '-' from base_slug);
  
  -- Check for uniqueness and add counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.daily_published WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- 4. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;