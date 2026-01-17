-- Insert Digraph Focus question with static options
INSERT INTO public.questions (
  id,
  label,
  description,
  placeholder_key,
  icon_name,
  static_options,
  sort_order,
  is_active
) VALUES (
  'DIGRAPH_FOCUS',
  'Would you like to cover multiple digraphs or focus on one specific digraph?',
  'Choose whether to include a variety of digraphs or master one sound',
  '{{DIGRAPH_FOCUS_OPTIONS}}',
  'Type',
  '[
    {"id": "DIGRAPH_MIXED", "label": "Mixed Digraphs", "description": "Variety in one book"},
    {"id": "DIGRAPH_SPECIFIC", "label": "Specific Digraph", "description": "Master one sound"}
  ]'::jsonb,
  26,
  true
)
ON CONFLICT (id) DO NOTHING;