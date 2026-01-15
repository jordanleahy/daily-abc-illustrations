-- Clean up orphaned 'digraphs' entry (singular form that wasn't caught)
UPDATE public.type_specific_discoveries
SET agent_type = 'book-creation-digraphs'
WHERE agent_type = 'digraphs';