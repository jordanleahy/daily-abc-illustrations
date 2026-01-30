-- Fix the 3 agents that didn't get the placeholder (different instruction structure)
-- These agents: book-creation-general, book-creation-rhyming, book-creation-sight-words

-- Mark current versions as not latest
UPDATE agents 
SET is_latest = false 
WHERE type IN ('book-creation-general', 'book-creation-rhyming', 'book-creation-sight-words') 
  AND is_latest = true;

-- Insert new versions with outline format placeholder prepended
INSERT INTO agents (
  user_id, 
  type, 
  name, 
  instructions, 
  intent, 
  version, 
  version_number, 
  is_latest, 
  parent_agent_id, 
  model, 
  max_completion_tokens, 
  top_p, 
  provider, 
  operational_status,
  what_changed
)
SELECT 
  user_id,
  type,
  name,
  '{{SHARED_OUTLINE_FORMAT}}

' || instructions as instructions,
  intent,
  'v' || (version_number + 1)::text || '.0.0' as version,
  version_number + 1,
  true,
  id as parent_agent_id,
  model,
  max_completion_tokens,
  top_p,
  provider,
  operational_status,
  'Added {{SHARED_OUTLINE_FORMAT}} placeholder for centralized page format standardization'
FROM agents 
WHERE type IN ('book-creation-general', 'book-creation-rhyming', 'book-creation-sight-words')
  AND is_latest = false
  AND version_number = (
    SELECT MAX(version_number) 
    FROM agents a2 
    WHERE a2.type = agents.type
  );