-- Update all book-creation agents to include {{SHARED_OUTLINE_FORMAT}} placeholder
-- This creates new versions with the format rules injected

-- First, mark current versions as not latest
UPDATE agents 
SET is_latest = false 
WHERE type LIKE 'book-creation%' AND is_latest = true;

-- Insert new versions with outline format placeholder added
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
  -- Prepend the outline format placeholder after the ZERO INVENTION POLICY section
  CASE 
    WHEN instructions LIKE '%## 🚨 CRITICAL: ZERO INVENTION POLICY%' THEN
      regexp_replace(
        instructions,
        '(## 🚨 CRITICAL: ZERO INVENTION POLICY 🚨[^#]*)(# )',
        E'\\1\n{{SHARED_OUTLINE_FORMAT}}\n\n\\2',
        'g'
      )
    ELSE
      '{{SHARED_OUTLINE_FORMAT}}

' || instructions
  END as instructions,
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
WHERE type LIKE 'book-creation%' 
  AND is_latest = false 
  AND id IN (
    SELECT id FROM agents 
    WHERE type LIKE 'book-creation%' 
    ORDER BY type, version_number DESC
  )
  AND NOT EXISTS (
    SELECT 1 FROM agents a2 
    WHERE a2.type = agents.type 
    AND a2.version_number > agents.version_number
  );