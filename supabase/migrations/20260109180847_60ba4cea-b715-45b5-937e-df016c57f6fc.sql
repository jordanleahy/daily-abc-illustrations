-- Add City question to book-creation (general) agent, after Location question
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic mountain/winter scenery
- ⚠️ CRITICAL FLOW ORDER:',
  '**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic mountain/winter scenery

**City Question:**

```
Would you like to set this book in a specific city? This is optional.

[SUGGEST]
JERSEY_CITY: 🌆 Jersey City
HOBOKEN: 🏘️ Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]
```

- ⚠️ CRITICAL FLOW ORDER:'
),
updated_at = now(),
last_modified = now()
WHERE type = 'book-creation' AND is_latest = true;