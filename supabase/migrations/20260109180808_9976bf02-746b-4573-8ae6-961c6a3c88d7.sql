-- Add City question (Step 8) to book-creation-abc agent, after Step 7 Location
-- Need to renumber subsequent steps

UPDATE agents 
SET instructions = REPLACE(
  instructions,
  'SKIP_LOCATION: ⏭️ Skip - No specific location
[/SUGGEST]
```

**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic mountain/winter scenery


### Step 8: Title and Description Approval',
  'SKIP_LOCATION: ⏭️ Skip - No specific location
[/SUGGEST]
```

**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic mountain/winter scenery


### Step 8: City Selection (OPTIONAL)
Ask about city setting:

```
Would you like to set this book in a specific city? This is optional.

[SUGGEST]
JERSEY_CITY: 🌆 Jersey City
HOBOKEN: 🏘️ Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]
```


### Step 9: Title and Description Approval'
),
updated_at = now(),
last_modified = now()
WHERE type = 'book-creation-abc' AND is_latest = true;