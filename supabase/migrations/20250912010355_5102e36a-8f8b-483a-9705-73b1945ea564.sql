-- Update agents table type constraint to include 'book-creation'
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_type_check;
ALTER TABLE public.agents ADD CONSTRAINT agents_type_check 
CHECK (type IN ('chat', 'assistant', 'book-creation'));