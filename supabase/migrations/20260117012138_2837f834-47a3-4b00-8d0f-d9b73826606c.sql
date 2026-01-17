-- Drop the partially created tables and recreate with proper policies
DROP TABLE IF EXISTS public.agent_questions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;

-- Question Registry: Defines available questions and their source tables
CREATE TABLE public.questions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  options_table TEXT, -- e.g., 'cities', 'character_themes', 'grade_levels'
  options_label_column TEXT DEFAULT 'label',
  options_value_column TEXT DEFAULT 'id',
  placeholder_key TEXT NOT NULL UNIQUE, -- e.g., '{{CITY_OPTIONS}}'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent-Question mapping: Which questions are enabled for which agents
CREATE TABLE public.agent_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_type, question_id)
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_questions ENABLE ROW LEVEL SECURITY;

-- Questions are readable by authenticated users
CREATE POLICY "Questions viewable by authenticated" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Agent questions readable by authenticated users
CREATE POLICY "Agent questions viewable by authenticated" ON public.agent_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can modify questions (check user_roles table)
CREATE POLICY "Questions modifiable by admins" ON public.questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can modify agent questions
CREATE POLICY "Agent questions modifiable by admins" ON public.agent_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed the question registry with existing option sources
INSERT INTO public.questions (id, label, description, options_table, options_label_column, options_value_column, placeholder_key, sort_order) VALUES
  ('city', 'City/Location', 'City or location for the book setting', 'cities', 'label', 'id', '{{CITY_OPTIONS}}', 1),
  ('character_theme', 'Character Theme', 'Visual theme for characters', 'character_themes', 'display_name', 'id', '{{CHARACTER_THEME_OPTIONS}}', 2),
  ('grade_level', 'Grade Level', 'Educational grade level', 'grade_levels', 'label', 'id', '{{GRADE_LEVEL_OPTIONS}}', 3),
  ('age_group', 'Age Group', 'Target age group', 'age_groups', 'label', 'id', '{{AGE_GROUP_OPTIONS}}', 4),
  ('letter_case', 'Letter Case', 'Uppercase or lowercase letters', NULL, NULL, NULL, '{{LETTER_CASE_OPTIONS}}', 5);

-- Create indexes for performance
CREATE INDEX idx_agent_questions_agent_type ON public.agent_questions(agent_type);
CREATE INDEX idx_agent_questions_question_id ON public.agent_questions(question_id);

-- Trigger for updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_questions_updated_at
  BEFORE UPDATE ON public.agent_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();