-- Insert digraphs book type
INSERT INTO public.book_types (id, label, icon_name, prompt, description, color, expected_page_count, is_active, sort_order)
VALUES (
  'digraphs',
  'Digraph Book',
  'BookOpen',
  'Create a digraph phonics book teaching letter pairs that make single sounds',
  'Learn ch, sh, th, wh, and other consonant digraphs through engaging stories',
  '#8B5CF6',
  12,
  true,
  14
);