-- Create book_system_prompts table
CREATE TABLE public.book_system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  is_deployed boolean NOT NULL DEFAULT false,
  is_latest boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deployed_at timestamp with time zone,
  source_type text NOT NULL DEFAULT 'manual',
  generation_metadata jsonb,
  
  -- Constraints
  UNIQUE(book_id, version_number),
  CONSTRAINT valid_source_type CHECK (source_type IN ('generated', 'manual'))
);

-- Enable RLS
ALTER TABLE public.book_system_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view prompts for their own books" 
ON public.book_system_prompts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.books 
  WHERE books.id = book_system_prompts.book_id 
  AND books.user_id = auth.uid()
));

CREATE POLICY "Users can create prompts for their own books" 
ON public.book_system_prompts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.books 
  WHERE books.id = book_system_prompts.book_id 
  AND books.user_id = auth.uid()
) AND auth.uid() = user_id);

CREATE POLICY "Users can update prompts for their own books" 
ON public.book_system_prompts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.books 
  WHERE books.id = book_system_prompts.book_id 
  AND books.user_id = auth.uid()
));

CREATE POLICY "Users can delete prompts for their own books" 
ON public.book_system_prompts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.books 
  WHERE books.id = book_system_prompts.book_id 
  AND books.user_id = auth.uid()
));

-- Admin policies
CREATE POLICY "Admins can view all book system prompts" 
ON public.book_system_prompts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all book system prompts" 
ON public.book_system_prompts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all book system prompts" 
ON public.book_system_prompts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to handle version management
CREATE OR REPLACE FUNCTION public.handle_book_system_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this book
  IF NEW.is_latest = true THEN
    UPDATE public.book_system_prompts 
    SET is_latest = false 
    WHERE book_id = NEW.book_id 
    AND id != NEW.id;
  END IF;
  
  -- If this is being deployed, mark all others as not deployed for this book
  IF NEW.is_deployed = true AND (OLD.is_deployed IS NULL OR OLD.is_deployed = false) THEN
    UPDATE public.book_system_prompts 
    SET is_deployed = false 
    WHERE book_id = NEW.book_id 
    AND id != NEW.id;
    
    -- Set deployment timestamp
    NEW.deployed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for version management
CREATE TRIGGER handle_book_system_prompt_version_trigger
  BEFORE INSERT OR UPDATE ON public.book_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_book_system_prompt_version();

-- Create trigger for updated_at
CREATE TRIGGER update_book_system_prompts_updated_at
  BEFORE UPDATE ON public.book_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get next version number for a book
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_book_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.book_system_prompts WHERE book_id = p_book_id),
    1
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;