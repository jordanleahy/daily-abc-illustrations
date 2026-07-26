DROP INDEX IF EXISTS public.idx_agent_questions_unique_enabled_sort_order;

-- Chat orchestrator shouldn't carry the city question row
DELETE FROM public.agent_questions WHERE agent_type = 'chat' AND question_id = 'city';

-- Ensure the standard baseline questions exist for every book-creation agent type
INSERT INTO public.agent_questions (agent_type, question_id, is_enabled, sort_order)
SELECT t.agent_type, q.question_id, true, 9000
FROM (SELECT DISTINCT agent_type FROM public.agent_questions WHERE agent_type LIKE 'book-creation%') t
CROSS JOIN (VALUES ('city'),('character_theme'),('grade_level'),('SEASON'),('custom_details')) AS q(question_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_questions x
  WHERE x.agent_type = t.agent_type AND x.question_id = q.question_id
);

-- Enable the baseline everywhere
UPDATE public.agent_questions
SET is_enabled = true, conditional_on_question_id = NULL, conditional_on_answer_id = NULL
WHERE agent_type LIKE 'book-creation%'
  AND question_id IN ('city','character_theme','grade_level','SEASON','custom_details');

-- Deterministic ordering: city, character_theme, grade_level, type-specific..., SEASON, custom_details
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