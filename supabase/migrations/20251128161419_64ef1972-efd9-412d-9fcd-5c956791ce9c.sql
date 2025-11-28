-- Create a function to execute read-only SQL queries for admin chat agent
-- This allows the AI agent to query the database for marketing insights

CREATE OR REPLACE FUNCTION public.execute_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow SELECT queries for safety
  IF query_text !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;