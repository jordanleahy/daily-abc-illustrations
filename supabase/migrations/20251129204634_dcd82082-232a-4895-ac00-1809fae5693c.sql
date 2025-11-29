-- Update Emotions and Opposites agents to use [SUGGEST] blocks for character themes

-- Emotions Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '### Step 1: Character Theme Selection
Present character theme options immediately using ```json blocks:

```json
paw-patrol: Paw Patrol
frozen: Frozen
peppa-pig: Peppa Pig
bluey: Bluey
cocomelon: Cocomelon
moana: Moana
mickey-mouse: Mickey Mouse
mario: Mario
sesame-street: Sesame Street
benji-davies: Benji Davies Style
black-and-white: Black & White
bear-stories: Bear Stories
custom: Custom Theme
no-theme: No Theme (Classic Educational)
```',
  '### Step 1: Character Theme Selection
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
WHERE type = 'book-creation-emotions' AND is_latest = true;

-- Opposites Agent
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '### Step 1: Character Theme Selection
After user selects "Opposites Book", immediately present character theme options:

"Perfect! Let''s create an Opposites book. First, which character theme would you like?

```json
paw-patrol: Paw Patrol
frozen: Frozen
peppa-pig: Peppa Pig
bluey: Bluey
cocomelon: Cocomelon
moana: Moana
mickey-mouse: Mickey Mouse
mario: Mario
sesame-street: Sesame Street
benji-davies: Benji Davies Style
black-and-white: Black & White
bear-stories: Bear Stories
custom: Custom Theme
no-theme: No Theme (Classic Educational)
```"',
  '### Step 1: Character Theme Selection
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
WHERE type = 'book-creation-opposites' AND is_latest = true;