-- Insert parent-education book type
INSERT INTO public.book_types (
  id, 
  label, 
  description, 
  icon_name, 
  color, 
  expected_page_count, 
  needs_clarification, 
  clarification_context, 
  prompt, 
  sort_order, 
  is_active
) VALUES (
  'parent-education',
  'Parent Education',
  'Literacy education for parents supporting readers ages 1-10',
  'GraduationCap',
  'text-indigo-500',
  12,
  true,
  'Ask about the child''s age range: 1-2 (listening and sounds), 3-4 (phonological awareness), 5-6 (decoding), 7-8 (fluency), or 9-10 (reading stamina). Each age group has different daily habit recommendations.',
  'I want to create a parent education book that helps parents understand how to support their child''s reading development with science-backed methods and practical daily habits.',
  14,
  true
);