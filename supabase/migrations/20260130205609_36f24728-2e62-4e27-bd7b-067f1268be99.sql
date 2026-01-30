-- Create shared_page_templates table for centralized cover and educational page prompts
CREATE TABLE public.shared_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,           -- 'cover' or 'educational'
  version_number INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,                -- The template with {{placeholders}}
  is_latest BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  change_notes TEXT,                    -- What changed in this version
  
  UNIQUE(template_key, version_number)
);

-- Enable RLS
ALTER TABLE public.shared_page_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage shared templates" ON public.shared_page_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates" ON public.shared_page_templates
  FOR SELECT USING (is_active = true AND is_latest = true);

-- Create trigger for updated_at
CREATE TRIGGER update_shared_page_templates_updated_at
  BEFORE UPDATE ON public.shared_page_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the cover template
INSERT INTO public.shared_page_templates (template_key, version_number, content, is_latest, is_active, change_notes)
VALUES (
  'cover',
  1,
  '## Cover Page (Page 1)

Generate a cover page with:
- Book title prominently displayed (MUST include "{{bookTypeWord}}" in the title)
- Character theme integration (if selected)
- Engaging, colorful illustration

⚠️ TITLE FORMAT (PRIORITY ORDER):
1. **With Resort:** "[Resort Name] {{bookTypeWord}}" (e.g., "Killington {{bookTypeWord}}")
2. **With City:** "[City] {{bookTypeWord}}" (e.g., "Jersey City {{bookTypeWord}}")
3. **Character Only:** "[Character]''s {{bookTypeWord}}" (e.g., "Bluey''s {{bookTypeWord}}")

⚠️ FORBIDDEN TITLES:
- ❌ Verbose titles like "Magical Snowy Adventure at Killington"
- ❌ Titles longer than 5-6 words
- ❌ Titles without "{{bookTypeWord}}"

{{COVER_TITLE_INSTRUCTION}}',
  true,
  true,
  'Initial cover page template with title format rules and placeholder support'
);

-- Seed the educational template
INSERT INTO public.shared_page_templates (template_key, version_number, content, is_latest, is_active, change_notes)
VALUES (
  'educational',
  1,
  '## Educational Focus Page (Page 2)

Generate Page 2 with three vertically-stacked colorful badges:
- **Grade Level Badge** (teal background): "{{gradeLevel}}"
- **Learning Type Badge** (coral background): "{{learningType}}"
- **Skill Focus Badge** (gold background): "{{skillFocus}}"

Image prompt for educational focus page must be 200-350 characters describing the badges with theme-specific styling. End with "No text overlays. Clean illustration only."',
  true,
  true,
  'Initial educational focus page template with badge configuration'
);