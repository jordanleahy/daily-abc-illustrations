-- Update the check constraint to include 'etsy' as a valid platform
ALTER TABLE public.book_social_posts DROP CONSTRAINT IF EXISTS book_social_posts_platform_check;

ALTER TABLE public.book_social_posts ADD CONSTRAINT book_social_posts_platform_check 
CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'ig_subscribers', 'etsy'));