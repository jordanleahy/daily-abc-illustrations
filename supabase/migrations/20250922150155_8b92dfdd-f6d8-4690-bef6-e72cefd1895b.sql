-- Add PDF URL field to daily_published table for storing uploaded PDF URLs
ALTER TABLE public.daily_published 
ADD COLUMN pdf_url TEXT;