-- Update platform check constraint to include ig_subscribers
ALTER TABLE public.book_social_posts DROP CONSTRAINT book_social_posts_platform_check;

ALTER TABLE public.book_social_posts 
ADD CONSTRAINT book_social_posts_platform_check 
CHECK (platform = ANY (ARRAY[
  'instagram'::text, 
  'facebook'::text, 
  'tiktok'::text, 
  'linkedin'::text, 
  'ig_subscribers'::text
]));