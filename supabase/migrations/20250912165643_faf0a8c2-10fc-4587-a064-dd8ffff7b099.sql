-- Update the agents table type check constraint to include illustration-director
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_type_check;

-- Add the updated constraint with all agent types
ALTER TABLE public.agents ADD CONSTRAINT agents_type_check 
CHECK (type IN ('chat', 'assistant', 'book-creation', 'illustration-director'));