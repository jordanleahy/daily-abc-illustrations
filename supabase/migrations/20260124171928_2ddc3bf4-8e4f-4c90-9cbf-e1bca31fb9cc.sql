-- Add a freeform text question to the questions registry
INSERT INTO questions (
  id,
  label,
  description,
  placeholder_key,
  icon_name,
  is_active,
  sort_order,
  static_options,
  options_table,
  options_label_column,
  options_value_column
) VALUES (
  'custom_details',
  'Custom Details',
  'Allows users to add any additional details, preferences, or special requests for their book. This is a freeform text input.',
  'CUSTOM_DETAILS',
  'MessageSquare',
  true,
  100,
  NULL,
  NULL,
  NULL,
  NULL
);