-- Phase 1: Add agent_type_suffix column for explicit agent type mapping
ALTER TABLE book_types 
ADD COLUMN IF NOT EXISTS agent_type_suffix TEXT DEFAULT NULL;

COMMENT ON COLUMN book_types.agent_type_suffix IS 
  'Suffix for agent type. Agent type = ''book-creation-'' + COALESCE(agent_type_suffix, id). NULL means use id directly.';