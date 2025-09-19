-- Create table for simplified image prompts
CREATE TABLE public.page_simplified_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  simplified_content TEXT NOT NULL,
  source_prompt_id UUID,
  version_number INTEGER NOT NULL DEFAULT 1,
  generation_status TEXT NOT NULL DEFAULT 'not_started',
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  generation_duration_ms INTEGER,
  error_message TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_simplified_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view simplified prompts for their own pages" 
ON public.page_simplified_prompts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_simplified_prompts.page_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create simplified prompts for their own pages" 
ON public.page_simplified_prompts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_simplified_prompts.page_id 
  AND b.user_id = auth.uid()
) AND auth.uid() = user_id);

CREATE POLICY "Users can update simplified prompts for their own pages" 
ON public.page_simplified_prompts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_simplified_prompts.page_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete simplified prompts for their own pages" 
ON public.page_simplified_prompts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_simplified_prompts.page_id 
  AND b.user_id = auth.uid()
));

-- Admin policies
CREATE POLICY "Admins can view all simplified prompts" 
ON public.page_simplified_prompts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all simplified prompts" 
ON public.page_simplified_prompts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all simplified prompts" 
ON public.page_simplified_prompts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get next version number for simplified prompts
CREATE OR REPLACE FUNCTION public.get_next_simplified_prompt_version_number(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.page_simplified_prompts WHERE page_id = p_page_id),
    1
  );
END;
$function$;

-- Create trigger to handle version management
CREATE OR REPLACE FUNCTION public.handle_simplified_prompt_version()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE TRIGGER simplified_prompt_version_trigger
  BEFORE INSERT OR UPDATE ON public.page_simplified_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_simplified_prompt_version();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_simplified_prompts_updated_at
BEFORE UPDATE ON public.page_simplified_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();