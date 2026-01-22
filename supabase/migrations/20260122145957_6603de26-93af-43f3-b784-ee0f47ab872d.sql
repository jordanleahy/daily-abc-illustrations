-- Create the specific digraph selection question with all 20 digraphs
INSERT INTO questions (id, label, description, icon_name, placeholder_key, static_options, is_active, sort_order)
VALUES (
  'DIGRAPH_SELECTION',
  'Which Digraph?',
  'Select a specific digraph to focus on',
  'BookOpen',
  '{{DIGRAPH_SELECTION_OPTIONS}}',
  '[
    {"id": "DIGRAPH_CH", "label": "ch", "description": "As in: chair, cheese, church"},
    {"id": "DIGRAPH_SH", "label": "sh", "description": "As in: ship, shell, shoe"},
    {"id": "DIGRAPH_TH", "label": "th", "description": "As in: think, bath, three"},
    {"id": "DIGRAPH_WH", "label": "wh", "description": "As in: whale, wheel, when"},
    {"id": "DIGRAPH_PH", "label": "ph", "description": "As in: phone, photo, graph"},
    {"id": "DIGRAPH_CK", "label": "ck", "description": "As in: duck, clock, trick"},
    {"id": "DIGRAPH_NG", "label": "ng", "description": "As in: ring, song, spring"},
    {"id": "DIGRAPH_NK", "label": "nk", "description": "As in: think, sink, trunk"},
    {"id": "DIGRAPH_QU", "label": "qu", "description": "As in: queen, quilt, quick"},
    {"id": "DIGRAPH_WR", "label": "wr", "description": "As in: write, wrist, wrong"},
    {"id": "DIGRAPH_GH", "label": "gh", "description": "As in: ghost, night, cough"},
    {"id": "DIGRAPH_KN", "label": "kn", "description": "As in: knee, knife, knock"},
    {"id": "DIGRAPH_SC", "label": "sc", "description": "As in: scene, scent, science"},
    {"id": "DIGRAPH_SK", "label": "sk", "description": "As in: skate, skip, sky"},
    {"id": "DIGRAPH_SM", "label": "sm", "description": "As in: smile, smell, small"},
    {"id": "DIGRAPH_SN", "label": "sn", "description": "As in: snow, snail, snake"},
    {"id": "DIGRAPH_SP", "label": "sp", "description": "As in: spin, spot, spray"},
    {"id": "DIGRAPH_ST", "label": "st", "description": "As in: star, stop, story"},
    {"id": "DIGRAPH_SW", "label": "sw", "description": "As in: swim, sweet, swing"},
    {"id": "DIGRAPH_TCH", "label": "tch", "description": "As in: catch, watch, match"}
  ]'::jsonb,
  true,
  6
)
ON CONFLICT (id) DO UPDATE SET
  static_options = EXCLUDED.static_options,
  description = EXCLUDED.description;

-- Add DIGRAPH_SELECTION to book-creation-digraphs agent (conditional on DIGRAPH_SPECIFIC selection)
-- Note: This is a follow-up question that appears after DIGRAPH_FOCUS when user selects "Specific Digraph"
INSERT INTO agent_questions (agent_type, question_id, is_enabled, sort_order)
VALUES ('book-creation-digraphs', 'DIGRAPH_SELECTION', true, 2)
ON CONFLICT (agent_type, question_id) DO UPDATE SET
  is_enabled = true,
  sort_order = 2;

-- Shift DIGRAPH_FOCUS to later position since selection comes after focus choice
UPDATE agent_questions 
SET sort_order = 3 
WHERE agent_type = 'book-creation-digraphs' AND question_id = 'SEASON';

-- Note: The conditional logic (only show DIGRAPH_SELECTION when DIGRAPH_SPECIFIC is chosen) 
-- should be handled in the edge function's question injection logic