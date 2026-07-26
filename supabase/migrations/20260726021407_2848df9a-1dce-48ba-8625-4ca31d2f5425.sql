DROP INDEX IF EXISTS public.idx_agent_questions_unique_enabled_sort_order;

INSERT INTO public.agent_questions (agent_type, question_id, is_enabled, sort_order)
SELECT DISTINCT aq.agent_type, 'city', true, 9999
FROM public.agent_questions aq
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_questions x
  WHERE x.agent_type = aq.agent_type AND x.question_id = 'city'
);

UPDATE public.agent_questions
SET is_enabled = true, conditional_on_question_id = NULL, conditional_on_answer_id = NULL
WHERE question_id = 'city';

WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY agent_type
           ORDER BY (question_id = 'city') DESC, sort_order, question_id
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