-- Update Burton Shop I Spy to expire at 7:01 AM ET tomorrow (Oct 10)
UPDATE daily_published 
SET 
  expires_at = '2025-10-10 11:01:00+00'::timestamp with time zone,
  updated_at = now()
WHERE id = '63428d54-5f1c-4209-adfd-8b2360e5a9e3';

-- Update Snowboard Tricks ABC expiration for consistency
UPDATE daily_published 
SET 
  expires_at = '2025-10-10 11:01:00+00'::timestamp with time zone,
  updated_at = now()
WHERE id = '3a4e1244-cd3f-4819-afff-9568d7a59555';