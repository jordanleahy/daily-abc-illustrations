-- Add foreign key constraint between page_system_prompts and pages
ALTER TABLE public.page_system_prompts 
ADD CONSTRAINT page_system_prompts_page_id_fkey 
FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;