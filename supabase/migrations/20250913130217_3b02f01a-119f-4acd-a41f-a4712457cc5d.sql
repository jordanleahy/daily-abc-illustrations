-- Add current_system_prompt_id field to books table
ALTER TABLE public.books 
ADD COLUMN current_system_prompt_id UUID REFERENCES public.book_system_prompts(id);

-- Create function to update current system prompt when one is deployed
CREATE OR REPLACE FUNCTION public.update_book_current_prompt()
RETURNS TRIGGER AS $$
BEGIN
  -- If this prompt is being deployed, update the book's current_system_prompt_id
  IF NEW.is_deployed = true AND (OLD.is_deployed IS NULL OR OLD.is_deployed = false) THEN
    UPDATE public.books 
    SET current_system_prompt_id = NEW.id 
    WHERE id = NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update book's current prompt when a prompt is deployed
CREATE TRIGGER update_book_current_prompt_trigger
  AFTER UPDATE ON public.book_system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_current_prompt();