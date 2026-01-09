-- Add City question (Step 8) to book-creation-emotions agent, after Step 7 Location
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  'SKIP_LOCATION: ⏭️ Skip - No specific location
[/SUGGEST]

**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic scenery appropriate to the environment selected

### Step 8: Title & Description Approval',
  'SKIP_LOCATION: ⏭️ Skip - No specific location
[/SUGGEST]

**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic scenery appropriate to the environment selected

### Step 8: City Selection (OPTIONAL)
"Would you like to set this book in a specific city? This is optional."

[SUGGEST]
JERSEY_CITY: 🌆 Jersey City
HOBOKEN: 🏘️ Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]

### Step 9: Title & Description Approval'
),
updated_at = now(),
last_modified = now()
WHERE type = 'book-creation-emotions' AND is_latest = true;