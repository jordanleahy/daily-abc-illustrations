-- Continue updating remaining specialized agents to use [SUGGEST] blocks

-- First Words Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Step 1: Character Theme** (IMMEDIATE)

```',
  '**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)

First, let''s pick a character theme to make your book extra special:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
frozen: ❄️ Frozen
peppa-pig: 🐷 Peppa Pig
bluey: 🐶 Bluey
cocomelon: 🎵 CoComelon
moana: 🌺 Moana
mickey-mouse: 🐭 Mickey Mouse
mario: 🍄 Mario
sesame-street: 🎪 Sesame Street
benji-davies: 🎨 Benji Davies Style
black-and-white: ⚫ Black & White
bear-stories: 🐻 Bear Stories
custom: ✏️ Custom Theme
no-theme: 📚 No Theme
[/SUGGEST]'
)
WHERE type = 'book-creation-first-words' AND is_latest = true;

-- Numbers Agent  
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '=== CONVERSATION FLOW (ALL RESPONSES USE ```json BLOCKS) ===

**Step 1: Character Theme** (IMMEDIATE)',
  '=== CONVERSATION FLOW ===

**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)

First, let''s pick a character theme to make your book extra special:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
frozen: ❄️ Frozen
peppa-pig: 🐷 Peppa Pig
bluey: 🐶 Bluey
cocomelon: 🎵 CoComelon
moana: 🌺 Moana
mickey-mouse: 🐭 Mickey Mouse
mario: 🍄 Mario
sesame-street: 🎪 Sesame Street
benji-davies: 🎨 Benji Davies Style
black-and-white: ⚫ Black & White
bear-stories: 🐻 Bear Stories
custom: ✏️ Custom Theme
no-theme: 📚 No Theme
[/SUGGEST]'
)
WHERE type = 'book-creation-numbers' AND is_latest = true;

-- Shapes Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Step 1: Character Theme** (IMMEDIATE)

```json',
  '**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)

First, let''s pick a character theme to make your book extra special:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
frozen: ❄️ Frozen
peppa-pig: 🐷 Peppa Pig
bluey: 🐶 Bluey
cocomelon: 🎵 CoComelon
moana: 🌺 Moana
mickey-mouse: 🐭 Mickey Mouse
mario: 🍄 Mario
sesame-street: 🎪 Sesame Street
benji-davies: 🎨 Benji Davies Style
black-and-white: ⚫ Black & White
bear-stories: 🐻 Bear Stories
custom: ✏️ Custom Theme
no-theme: 📚 No Theme
[/SUGGEST]'
)
WHERE type = 'book-creation-shapes' AND is_latest = true;

-- Sight Words Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Step 1: Character Theme** (IMMEDIATE)

``',
  '**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)

First, let''s pick a character theme to make your book extra special:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
frozen: ❄️ Frozen
peppa-pig: 🐷 Peppa Pig
bluey: 🐶 Bluey
cocomelon: 🎵 CoComelon
moana: 🌺 Moana
mickey-mouse: 🐭 Mickey Mouse
mario: 🍄 Mario
sesame-street: 🎪 Sesame Street
benji-davies: 🎨 Benji Davies Style
black-and-white: ⚫ Black & White
bear-stories: 🐻 Bear Stories
custom: ✏️ Custom Theme
no-theme: 📚 No Theme
[/SUGGEST]'
)
WHERE type = 'book-creation-sight-words' AND is_latest = true;