-- Update the opposites agent's conversation flow to include optional questions in the correct order
-- This fixes the issue where the agent gets stuck after clothing brand selection

UPDATE agents
SET instructions = REPLACE(
  instructions,
  '### Step 4: Title and Description Approval
Based on selections, generate a brief title and description.
Present for approval:

"Here''s what I''m thinking for your book:
**Title:** [Generated Title]
**Description:** [Brief description]

Does this look good?"

[SUGGEST]
approve: ✅ Looks great!
edit-title: ✏️ Change the title
edit-description: 📝 Change the description
[/SUGGEST]

### Step 5: Complete Outline Generation',
  '### Step 4: Optional Discovery Questions (Ask ONE at a time)
After category selection, ask these optional questions ONE AT A TIME. Skip any that have already been answered based on context injections.

**4a. Season Question** (skip if already selected):
"Would you like the book to have a seasonal theme? This is optional."

[SUGGEST]
SPRING: 🌸 Spring
SUMMER: ☀️ Summer
FALL: 🍂 Fall
WINTER: ❄️ Winter
skip-season: ⏭️ Skip
[/SUGGEST]

**4b. Environment Question** (skip if already selected):
"Would you like the book set in a specific environment? This is optional."

[SUGGEST]
CITY: 🏙️ City
SNOWBOARD_RESORT: 🏂 Snowboard Resort
SKI_RESORT: ⛷️ Ski Resort
ISLAND: 🏝️ Island
DESERT: 🏜️ Desert
MOUNTAIN: 🏔️ Mountain
PARK: 🌳 Park
skip-environment: ⏭️ Skip
[/SUGGEST]

**4c. Location Question** (skip if already selected or no snowboard/ski environment):
"Would you like to set this book at a specific resort? This is optional."

[SUGGEST]
VAIL_RESORT: 🏔️ Vail Resort
SUGARBUSH_RESORT: 🍁 Sugarbush Resort
STRATTON: ⛷️ Stratton
KILLINGTON: 🏂 Killington Mountain
MOUNTAIN_CREEK: 🎿 Mountain Creek
COPPER_MOUNTAIN: 🥉 Copper Mountain
BRECKENRIDGE: 🏘️ Breckenridge
KEYSTONE: 🌙 Keystone
skip-location: ⏭️ Skip (no specific resort)
[/SUGGEST]

**4d. Clothing Brand Question** (skip if already selected):
"Would you like characters to wear branded clothing?"

[SUGGEST]
BURTON: 🏂 Burton
NONE: 👕 No brand
skip-clothing-brand: ⏭️ Skip
[/SUGGEST]

### Step 5: Title and Description Approval
After ALL optional questions are complete (or skipped), generate a brief title and description.
Present for approval:

"Here''s what I''m thinking for your book:
**Title:** [Generated Title]
**Description:** [Brief description]

Does this look good?"

[SUGGEST]
approve: ✅ Looks great!
edit-title: ✏️ Change the title
edit-description: 📝 Change the description
[/SUGGEST]

### Step 6: Complete Outline Generation'
),
version = '1.3.0',
version_number = version_number + 1,
what_changed = 'Fixed conversation flow to include optional discovery questions (season, environment, location, clothing brand) as explicit Step 4 sub-steps before title approval. This prevents the agent from getting stuck after receiving optional question answers.'
WHERE type = 'book-creation-opposites' AND is_latest = true;