DROP INDEX IF EXISTS public.idx_agent_questions_unique_enabled_sort_order;

INSERT INTO public.questions (id, label, description, placeholder_key, icon_name, is_active, sort_order, static_options)
VALUES (
  'colors_focus',
  'Color Focus',
  'Which colors should this book explore?',
  '{{COLORS_FOCUS_OPTIONS}}',
  'Palette',
  true,
  23,
  '[
    {"id":"COLORS_PRIMARY","label":"Primary Colors","emoji":"🔴","description":"Red, blue, and yellow basics"},
    {"id":"COLORS_RAINBOW","label":"Rainbow Colors","emoji":"🌈","description":"All seven rainbow colors in order"},
    {"id":"COLORS_NATURE","label":"Colors in Nature","emoji":"🌳","description":"Colors found outdoors: sky, leaves, flowers"},
    {"id":"COLORS_MIXING","label":"Mixing Colors","emoji":"🎨","description":"How two colors combine to make a new one"},
    {"id":"COLORS_EVERYDAY","label":"Everyday Colors","emoji":"🏠","description":"Colors of familiar objects at home and school"},
    {"id":"COLORS_MIXED","label":"A Little of Everything","emoji":"🎲","description":"A fun variety of color concepts"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    placeholder_key = EXCLUDED.placeholder_key,
    icon_name = EXCLUDED.icon_name,
    is_active = true,
    static_options = EXCLUDED.static_options,
    updated_at = now();

-- Colors books stop reusing the opposites/resort questions
UPDATE public.agent_questions
SET is_enabled = false, updated_at = now()
WHERE agent_type = 'book-creation-colors'
  AND question_id IN ('opposites_category', 'RESORT');

-- Attach the dedicated colors question
INSERT INTO public.agent_questions (agent_type, question_id, is_enabled, sort_order)
VALUES ('book-creation-colors', 'colors_focus', true, 100)
ON CONFLICT (agent_type, question_id) DO UPDATE
SET is_enabled = true, sort_order = 100, updated_at = now();

-- Re-apply deterministic ordering
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY agent_type
           ORDER BY CASE question_id
                      WHEN 'city' THEN 0
                      WHEN 'character_theme' THEN 1
                      WHEN 'grade_level' THEN 2
                      WHEN 'SEASON' THEN 8000
                      WHEN 'custom_details' THEN 9000
                      ELSE 100
                    END,
                    sort_order, question_id
         ) - 1 AS new_order
  FROM public.agent_questions
)
UPDATE public.agent_questions aq
SET sort_order = o.new_order, updated_at = now()
FROM ordered o
WHERE aq.id = o.id;

CREATE UNIQUE INDEX idx_agent_questions_unique_enabled_sort_order
  ON public.agent_questions USING btree (agent_type, sort_order)
  WHERE (is_enabled = true);