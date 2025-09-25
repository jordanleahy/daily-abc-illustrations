INSERT INTO public.user_roles (user_id, role) 
VALUES ('580e8267-91cd-4436-aa3c-6f572b706e9e', 'teacher')
ON CONFLICT (user_id, role) DO NOTHING;