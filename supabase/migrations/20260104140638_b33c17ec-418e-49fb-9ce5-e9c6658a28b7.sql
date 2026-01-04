-- Create book_type for Song Books
INSERT INTO public.book_types (
  id,
  label,
  icon_name,
  description,
  expected_page_count,
  prompt,
  color,
  sort_order,
  is_active,
  needs_clarification,
  created_at,
  updated_at
) VALUES (
  'song',
  'Song Book',
  'Music2',
  'Original songs with lyrics children can sing along to, calibrated by grade level',
  12,
  'I want to create a song book with lyrics children can sing and learn from',
  'text-pink-500',
  15,
  true,
  false,
  now(),
  now()
);