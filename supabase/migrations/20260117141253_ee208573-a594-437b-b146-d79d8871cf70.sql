
-- Update question labels to be short category names instead of full questions
UPDATE public.questions SET label = 'Theme' WHERE id = 'THEME';
UPDATE public.questions SET label = 'Digraph Focus' WHERE id = 'DIGRAPH_FOCUS';
UPDATE public.questions SET label = 'Season' WHERE id = 'SEASON';
UPDATE public.questions SET label = 'Brand' WHERE id = 'BRAND';
