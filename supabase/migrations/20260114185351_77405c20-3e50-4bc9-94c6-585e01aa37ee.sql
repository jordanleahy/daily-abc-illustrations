-- Create book_types entry for Manners
INSERT INTO book_types (
  id, 
  label, 
  description, 
  icon_name, 
  color, 
  expected_page_count, 
  needs_clarification, 
  clarification_context,
  is_active,
  sort_order
) VALUES (
  'manners',
  'Manners Book',
  'Social skills and manners education for children (10 content pages)',
  'Heart',
  'text-pink-500',
  12,
  true,
  'Manners type selection: eating habits, greetings, sharing, please/thank you. Environment: home or school setting.',
  true,
  20
);