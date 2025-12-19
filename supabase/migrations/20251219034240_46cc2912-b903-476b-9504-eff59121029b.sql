-- Update the agents type check constraint to include parent-education
ALTER TABLE public.agents DROP CONSTRAINT agents_type_check;

ALTER TABLE public.agents ADD CONSTRAINT agents_type_check CHECK (
  type = ANY (ARRAY[
    'chat'::text, 
    'book-creation'::text, 
    'book-creation-general'::text, 
    'book-creation-abc'::text, 
    'book-creation-numbers'::text, 
    'book-creation-rhyming'::text, 
    'book-creation-colors'::text, 
    'book-creation-shapes'::text, 
    'book-creation-opposites'::text, 
    'book-creation-emotions'::text, 
    'book-creation-animals'::text, 
    'book-creation-first-words'::text, 
    'book-creation-bedtime'::text, 
    'book-creation-cvc'::text, 
    'book-creation-sight-words'::text, 
    'book-creation-digraphs'::text, 
    'book-creation-dr-seuss'::text,
    'book-creation-parent-education'::text,
    'illustration-director'::text, 
    'graphic-designer'::text
  ])
);