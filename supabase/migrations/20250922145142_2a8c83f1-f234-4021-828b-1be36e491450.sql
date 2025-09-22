-- Remove the exports table and related functionality
-- This will eliminate all server-side PDF generation complexity

DROP TABLE IF EXISTS public.exports;

-- Also remove the generate-pdf edge function's database dependencies
-- The edge function itself will be removed from the codebase