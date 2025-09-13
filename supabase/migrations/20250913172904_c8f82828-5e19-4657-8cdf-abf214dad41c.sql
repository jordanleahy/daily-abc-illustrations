-- Create page_system_prompts table
CREATE TABLE public.page_system_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  book_id UUID NOT NULL, -- For easier querying and RLS
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  is_deployed BOOLEAN NOT NULL DEFAULT false,
  deployed_at TIMESTAMP WITH TIME ZONE,
  source_type TEXT NOT NULL DEFAULT 'manual'::text,
  generation_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_system_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view prompts for their own pages" 
ON public.page_system_prompts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_system_prompts.page_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create prompts for their own pages" 
ON public.page_system_prompts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_system_prompts.page_id 
  AND b.user_id = auth.uid()
) AND auth.uid() = user_id);

CREATE POLICY "Users can update prompts for their own pages" 
ON public.page_system_prompts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_system_prompts.page_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete prompts for their own pages" 
ON public.page_system_prompts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_system_prompts.page_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Admins can view all page system prompts" 
ON public.page_system_prompts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all page system prompts" 
ON public.page_system_prompts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all page system prompts" 
ON public.page_system_prompts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get next version number for page prompts
CREATE OR REPLACE FUNCTION public.get_next_page_prompt_version_number(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.page_system_prompts WHERE page_id = p_page_id),
    1
  );
END;
$$;

-- Create trigger function to handle page system prompt versions
CREATE OR REPLACE FUNCTION public.handle_page_system_prompt_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this page
  IF NEW.is_latest = true THEN
    UPDATE public.page_system_prompts 
    SET is_latest = false 
    WHERE page_id = NEW.page_id 
    AND id != NEW.id;
  END IF;
  
  -- If this is being deployed, mark all others as not deployed for this page
  IF NEW.is_deployed = true AND (OLD.is_deployed IS NULL OR OLD.is_deployed = false) THEN
    UPDATE public.page_system_prompts 
    SET is_deployed = false 
    WHERE page_id = NEW.page_id 
    AND id != NEW.id;
    
    -- Set deployment timestamp
    NEW.deployed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger function to update page's current prompt
CREATE OR REPLACE FUNCTION public.update_page_current_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this prompt is being deployed, update the page's current_system_prompt_id
  IF NEW.is_deployed = true AND (OLD.is_deployed IS NULL OR OLD.is_deployed = false) THEN
    UPDATE public.pages 
    SET current_system_prompt_id = NEW.id 
    WHERE id = NEW.page_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add current_system_prompt_id column to pages table
ALTER TABLE public.pages ADD COLUMN current_system_prompt_id UUID;

-- Create triggers
CREATE TRIGGER handle_page_system_prompt_version_trigger
  BEFORE UPDATE ON public.page_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_page_system_prompt_version();

CREATE TRIGGER update_page_current_prompt_trigger
  AFTER UPDATE ON public.page_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_page_current_prompt();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_page_system_prompts_updated_at
  BEFORE UPDATE ON public.page_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();