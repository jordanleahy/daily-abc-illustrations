-- Create kid_profiles table
CREATE TABLE public.kid_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on kid_profiles
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kid_profiles
CREATE POLICY "Parents can view their own kids" 
ON public.kid_profiles 
FOR SELECT 
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can insert their own kids" 
ON public.kid_profiles 
FOR INSERT 
WITH CHECK (parent_user_id = auth.uid() AND first_name IS NOT NULL AND last_name IS NOT NULL);

CREATE POLICY "Parents can update their own kids" 
ON public.kid_profiles 
FOR UPDATE 
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their own kids" 
ON public.kid_profiles 
FOR DELETE 
USING (parent_user_id = auth.uid());

CREATE POLICY "Admins can view all kid profiles" 
ON public.kid_profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view all kid profiles" 
ON public.kid_profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Create storage bucket for kid profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kid-profile-images', 'kid-profile-images', false);

-- Create storage policies for kid profile images
CREATE POLICY "Parents can view their own kids' images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kid-profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Parents can upload their own kids' images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'kid-profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Parents can update their own kids' images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'kid-profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Parents can delete their own kids' images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'kid-profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_kid_profiles_updated_at
BEFORE UPDATE ON public.kid_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function to get user's kids
CREATE OR REPLACE FUNCTION public.get_user_kids()
RETURNS SETOF public.kid_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.kid_profiles
  WHERE parent_user_id = auth.uid()
    AND is_active = true
  ORDER BY created_at ASC;
END;
$$;