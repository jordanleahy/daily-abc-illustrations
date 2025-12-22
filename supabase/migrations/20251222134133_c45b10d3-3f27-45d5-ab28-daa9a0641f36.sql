-- Create the character-thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-thumbnails',
  'character-thumbnails',
  true,
  1048576, -- 1MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow public read access to character thumbnails
CREATE POLICY "Anyone can view character thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-thumbnails');

-- Allow admins to upload/manage character thumbnails
CREATE POLICY "Admins can upload character thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update character thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'character-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete character thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));