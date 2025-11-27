-- Phase 2: Migrate all specialized agents to JSON Schema structured output format
-- This migration removes [SUGGEST] block instructions and adds JSON response format

-- First, create a temporary function to help with the replacement
CREATE OR REPLACE FUNCTION update_agent_to_json_format(agent_type_val text) 
RETURNS void AS $$
DECLARE
  current_instructions text;
  new_instructions text;
BEGIN
  -- Get current instructions
  SELECT instructions INTO current_instructions
  FROM agents
  WHERE type = agent_type_val AND is_latest = true;
  
  IF current_instructions IS NULL THEN
    RETURN;
  END IF;
  
  -- Remove old [SUGGEST] enforcement sections
  new_instructions := regexp_replace(
    current_instructions,
    '## CRITICAL: \[SUGGEST\] Block Enforcement[\s\S]*?(?=##|$)',
    '',
    'g'
  );
  
  -- Remove any remaining [SUGGEST] references in examples
  new_instructions := replace(new_instructions, '[SUGGEST]', '```json');
  new_instructions := replace(new_instructions, '[/SUGGEST]', '```');
  
  -- Add new JSON response format section at the beginning after title
  new_instructions := regexp_replace(
    new_instructions,
    '(# [^\n]+\n)',
    E'\\1\n## Response Format\n\nYou MUST respond with valid JSON in this exact format:\n\n```json\n{\n  "message": "Your conversational message to the user",\n  "suggestions": [\n    {"id": "machine-id", "label": "Display Text"},\n    {"id": "another-id", "label": "Another Option"}\n  ]\n}\n```\n\n### When to Include Suggestions\n\n**Include suggestions array (with items)** when:\n- Asking user to make a choice (theme, age, type-specific options, approval)\n- Presenting multiple predefined options\n- User needs to select from a list\n\n**Use empty suggestions array []** when:\n- Asking open-ended questions (custom theme, custom topic, free-form input)\n- Requesting text input from user\n- Following up after user provides custom input\n\n### Example Responses\n\n**With suggestions (multiple choice):**\n```json\n{\n  "message": "Which character theme would you like?",\n  "suggestions": [\n    {"id": "paw-patrol", "label": "🐾 Paw Patrol"},\n    {"id": "frozen", "label": "❄️ Frozen"},\n    {"id": "custom", "label": "✏️ Custom Theme"}\n  ]\n}\n```\n\n**Without suggestions (open-ended):**\n```json\n{\n  "message": "What custom theme would you like? For example: dinosaurs, space, unicorns, pirates, etc.",\n  "suggestions": []\n}\n```\n\n**Approval options:**\n```json\n{\n  "message": "Here is the book title and description:\\n\\n**Title**\\nDescription here.\\n\\nDoes this sound good?",\n  "suggestions": [\n    {"id": "approve", "label": "✅ Looks perfect!"},\n    {"id": "edit-title", "label": "📝 Change title"},\n    {"id": "edit-description", "label": "📄 Change description"}\n  ]\n}\n```\n\n'
  );
  
  -- Update the agent
  UPDATE agents
  SET 
    instructions = new_instructions,
    updated_at = NOW()
  WHERE type = agent_type_val AND is_latest = true;
  
  RAISE NOTICE 'Updated agent: %', agent_type_val;
END;
$$ LANGUAGE plpgsql;

-- Update all 12 specialized book creation agents
SELECT update_agent_to_json_format('book-creation-abc');
SELECT update_agent_to_json_format('book-creation-rhyming');
SELECT update_agent_to_json_format('book-creation-opposites');
SELECT update_agent_to_json_format('book-creation-emotions');
SELECT update_agent_to_json_format('book-creation-animals');
SELECT update_agent_to_json_format('book-creation-bedtime');
SELECT update_agent_to_json_format('book-creation-colors');
SELECT update_agent_to_json_format('book-creation-cvc');
SELECT update_agent_to_json_format('book-creation-first-words');
SELECT update_agent_to_json_format('book-creation-numbers');
SELECT update_agent_to_json_format('book-creation-shapes');
SELECT update_agent_to_json_format('book-creation-sight-words');

-- Clean up the temporary function
DROP FUNCTION update_agent_to_json_format(text);

-- Verify the updates
SELECT 
  type,
  name,
  LEFT(instructions, 100) as instructions_preview,
  CASE 
    WHEN instructions LIKE '%## Response Format%' THEN '✅ Migrated'
    ELSE '❌ Not migrated'
  END as migration_status,
  updated_at
FROM agents
WHERE type LIKE 'book-creation-%' AND is_latest = true
ORDER BY type;