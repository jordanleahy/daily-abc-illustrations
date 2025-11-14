-- Make all page image URLs publicly readable
-- This allows anyone to view images without authentication or subscription checks

-- Drop existing complex SELECT policies
DROP POLICY IF EXISTS "Admins can view all page images" ON page_image_urls;
DROP POLICY IF EXISTS "Anyone can view latest page images for active daily published b" ON page_image_urls;
DROP POLICY IF EXISTS "Authenticated users with subscription can view library images" ON page_image_urls;
DROP POLICY IF EXISTS "Images of public pages are readable" ON page_image_urls;
DROP POLICY IF EXISTS "Teachers can view all page images" ON page_image_urls;
DROP POLICY IF EXISTS "Teachers can view images for all daily published books" ON page_image_urls;
DROP POLICY IF EXISTS "Users can view images for their own pages" ON page_image_urls;

-- Create single public read policy
CREATE POLICY "Anyone can view all page images"
  ON page_image_urls
  FOR SELECT
  USING (true);

-- Keep write policies restricted to owners and admins
-- (existing INSERT, UPDATE, DELETE policies remain unchanged)