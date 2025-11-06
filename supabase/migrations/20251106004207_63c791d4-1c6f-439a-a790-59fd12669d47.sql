-- Create storage bucket for PNG variants
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-images-png', 'page-images-png', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for page-images-png bucket
-- Allow public read access
CREATE POLICY "Public can view PNG images"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-images-png');

-- Allow service role to insert/update/delete
CREATE POLICY "Service role can manage PNG images"
ON storage.objects FOR ALL
USING (bucket_id = 'page-images-png' AND auth.role() = 'service_role');