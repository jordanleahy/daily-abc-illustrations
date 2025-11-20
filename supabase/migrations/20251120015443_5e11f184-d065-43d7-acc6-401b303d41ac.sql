-- Allow admins to create page images for any book
CREATE POLICY "Admins can create images for any page"
ON page_image_urls
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));