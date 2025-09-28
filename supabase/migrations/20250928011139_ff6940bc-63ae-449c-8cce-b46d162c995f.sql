-- Make kid-profile-images bucket public so profile images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kid-profile-images';