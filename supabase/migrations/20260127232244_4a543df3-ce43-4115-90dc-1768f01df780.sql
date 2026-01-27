-- Re-sequence ENABLED questions to [0, 1, 2, 3, 4, 5] for opposites agent
WITH ranked_enabled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, created_at) - 1 as new_order
  FROM agent_questions
  WHERE agent_type = 'book-creation-opposites' AND is_enabled = true
)
UPDATE agent_questions aq
SET sort_order = r.new_order
FROM ranked_enabled r WHERE aq.id = r.id;

-- Set DISABLED questions to high values [100, 101, 102...] for opposites agent
WITH ranked_disabled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, created_at) + 99 as new_order
  FROM agent_questions
  WHERE agent_type = 'book-creation-opposites' AND is_enabled = false
)
UPDATE agent_questions aq
SET sort_order = r.new_order
FROM ranked_disabled r WHERE aq.id = r.id;