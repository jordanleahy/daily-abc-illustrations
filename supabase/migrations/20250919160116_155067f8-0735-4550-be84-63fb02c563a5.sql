-- Fix search_path for the functions I created
CREATE OR REPLACE FUNCTION public.get_next_simplified_prompt_version_number(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.page_simplified_prompts WHERE page_id = p_page_id),
    1
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_simplified_prompt_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this page
  IF NEW.is_latest = true THEN
    UPDATE public.page_simplified_prompts 
    SET is_latest = false 
    WHERE page_id = NEW.page_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;