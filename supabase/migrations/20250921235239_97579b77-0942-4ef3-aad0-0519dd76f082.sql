-- Create SEO metadata for all 5 books missing SEO data
INSERT INTO seo_metadata (
  daily_published_id,
  user_id,
  seo_title,
  seo_description,
  og_image_url,
  optimization_status,
  is_latest,
  is_active,
  version_number,
  optimized_at,
  source_data
) VALUES 
-- 1. A is for Arctic Adventures
(
  '2e7a8de4-f606-47ac-911f-c999865b519d'::uuid,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid,
  'A is for Arctic Adventures: Winter Words & Snowboard Fun',
  'A simple winter and snowboard book that teaches children A words and other winter words. Kids will learn warm clothing, snowy places, and safe fun in the snow.',
  (SELECT thumbnail_url FROM book_thumbnails WHERE book_id = '73a27338-475f-43bf-bec0-4e2f55512dfe' AND is_latest = true AND generation_status = 'complete' LIMIT 1),
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object('bookId', '73a27338-475f-43bf-bec0-4e2f55512dfe', 'source', 'batch_repair', 'created_by', 'system_audit')
),
-- 2. Dora the Explorer ABC Adventure
(
  '0fe853de-1627-44bc-abad-62ca130716ee'::uuid,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid,
  'Dora the Explorer ABC Adventure: Learn Letters with Fun',
  'Children learn letters with Dora and explore simple words. Perfect educational adventure for young learners with engaging activities.',
  (SELECT thumbnail_url FROM book_thumbnails WHERE book_id = '72318c87-144d-4176-9fa5-a3d1d02c9d55' AND is_latest = true AND generation_status = 'complete' LIMIT 1),
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object('bookId', '72318c87-144d-4176-9fa5-a3d1d02c9d55', 'source', 'batch_repair', 'created_by', 'system_audit')
),
-- 3. Magical Frozen Land ABC  
(
  '28ca0b90-4ed1-4fe6-b9ce-08a3eabcd63c'::uuid,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid,
  'Magical Frozen Land ABC: Learn Letter Sounds in Winter Kingdom',
  'Learn A–Z letter sounds in a cozy frozen kingdom with friendly characters and magical winter scenes. Perfect for young learners.',
  (SELECT thumbnail_url FROM book_thumbnails WHERE book_id = '5550905e-d951-42aa-98dc-fb018347ced2' AND is_latest = true AND generation_status = 'complete' LIMIT 1),
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object('bookId', '5550905e-d951-42aa-98dc-fb018347ced2', 'source', 'batch_repair', 'created_by', 'system_audit')
),
-- 4. Snowboard Tricks ABC
(
  '3a4e1244-cd3f-4819-afff-9568d7a59555'::uuid,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid,
  'Snowboard Tricks ABC: Learn Letters with Fun Winter Sports',
  'A fun ABC book about snowboarding words and tricks. Children will learn letters and simple snowboard ideas like jumps, turns, and gear.',
  (SELECT thumbnail_url FROM book_thumbnails WHERE book_id = '48bec046-6c8f-44b2-9d87-c119f0cb2f7a' AND is_latest = true AND generation_status = 'complete' LIMIT 1),
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object('bookId', '48bec046-6c8f-44b2-9d87-c119f0cb2f7a', 'source', 'batch_repair', 'created_by', 'system_audit')
),
-- 5. What is the Sound ABC
(
  '78d9fb84-81a6-486a-be09-ff0586d6f27b'::uuid,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid,
  'What is the Sound ABC: Learn Letter Sounds with Fun Activities',
  'A simple ABC book that teaches letter sounds with familiar words and fun activities for young children. Perfect for early learning.',
  (SELECT thumbnail_url FROM book_thumbnails WHERE book_id = '2c4d1580-f330-4ec2-9540-c929d16189cd' AND is_latest = true AND generation_status = 'complete' LIMIT 1),
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object('bookId', '2c4d1580-f330-4ec2-9540-c929d16189cd', 'source', 'batch_repair', 'created_by', 'system_audit')
);