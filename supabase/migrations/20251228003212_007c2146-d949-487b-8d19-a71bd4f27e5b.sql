-- Temporarily disable the validation trigger that checks for images
ALTER TABLE daily_published DISABLE TRIGGER enforce_images_before_daily_publish;

-- Step 1: Set all slugs to temporary unique values based on their ID
UPDATE daily_published
SET slug = 'temp-' || id::text;

-- Step 2: Update to proper slugs based on book_name with duplicate handling
WITH ranked_publications AS (
  SELECT 
    dp.id,
    SUBSTRING(
      TRIM(BOTH '-' FROM 
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              LOWER(TRIM(b.book_name)),
              '[^a-z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ), 1, 55
    ) as base_slug,
    ROW_NUMBER() OVER (PARTITION BY b.book_name ORDER BY dp.created_at) as rn
  FROM daily_published dp
  JOIN books b ON dp.book_id = b.id
)
UPDATE daily_published dp
SET slug = CASE 
    WHEN rp.rn = 1 THEN rp.base_slug
    ELSE rp.base_slug || '-v' || rp.rn
  END
FROM ranked_publications rp
WHERE dp.id = rp.id;

-- Re-enable the trigger
ALTER TABLE daily_published ENABLE TRIGGER enforce_images_before_daily_publish;