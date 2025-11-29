-- Update all specialized agents to use [SUGGEST] blocks for character theme selection
-- This ensures character themes render as clickable thumbnails like ABC does

-- Animals Agent
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
WHERE type = 'book-creation-animals' AND is_latest = true;

-- Bedtime Agent
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
WHERE type = 'book-creation-bedtime' AND is_latest = true;

-- Colors Agent
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
WHERE type = 'book-creation-colors' AND is_latest = true;

-- CVC Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Step 1: Character Theme** (IMMEDIATE)

```js',
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
WHERE type = 'book-creation-cvc' AND is_latest = true;