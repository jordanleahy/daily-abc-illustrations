-- Add static_options column to questions table for inline options
ALTER TABLE public.questions 
ADD COLUMN static_options JSONB DEFAULT NULL;

-- Add a constraint to ensure either options_table OR static_options is set (or neither for free-text)
COMMENT ON COLUMN public.questions.static_options IS 'Inline options array for questions without a dedicated lookup table. Format: [{"value": "id", "label": "Display Name"}, ...]';

-- Add icon_name column to allow custom icons per question
ALTER TABLE public.questions
ADD COLUMN icon_name TEXT DEFAULT 'HelpCircle';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active) WHERE is_active = true;