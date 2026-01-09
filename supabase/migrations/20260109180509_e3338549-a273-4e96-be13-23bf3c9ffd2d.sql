-- Add Step 4e (City Question) to the book-creation-opposites agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**4d. Clothing Brand Question** (skip if already selected):
"Would you like characters to wear branded clothing?"

[SUGGEST]
BURTON: 🏂 Burton
NONE: 👕 No brand
skip-clothing-brand: ⏭️ Skip
[/SUGGEST]

### Step 5:',
  '**4d. Clothing Brand Question** (skip if already selected):
"Would you like characters to wear branded clothing?"

[SUGGEST]
BURTON: 🏂 Burton
NONE: 👕 No brand
skip-clothing-brand: ⏭️ Skip
[/SUGGEST]

**4e. City Question** (skip if already selected):
"Would you like to set this book in a specific city? This is optional."

[SUGGEST]
JERSEY_CITY: 🌆 Jersey City
HOBOKEN: 🏘️ Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]

### Step 5:'
),
updated_at = now(),
last_modified = now()
WHERE type = 'book-creation-opposites' AND is_latest = true;