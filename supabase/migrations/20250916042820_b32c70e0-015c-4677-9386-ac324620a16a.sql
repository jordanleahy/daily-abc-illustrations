-- Remove 'assistant' from agents table type constraint
-- Since no 'assistant' agents exist in the database, this is safe

-- Drop the existing constraint if it exists
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_type_check;

-- Add the new constraint without 'assistant'
ALTER TABLE public.agents ADD CONSTRAINT agents_type_check 
CHECK (type IN ('chat', 'book-creation', 'illustration-director', 'graphic-designer'));