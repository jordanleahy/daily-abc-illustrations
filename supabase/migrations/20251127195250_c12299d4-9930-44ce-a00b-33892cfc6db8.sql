-- Fix Emotions agent character theme format to match ABC standard
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    E'[SUGGEST]\n🐾 Paw Patrol\n❄️ Frozen\n🐷 Peppa Pig\n🐶 Bluey\n🎵 Cocomelon\n🌊 Moana\n🐭 Mickey Mouse\n🍄 Mario\n🎪 Sesame Street\n📚 Benji Davies Style\n⚫ Black & White\n🐻 Bear Stories\n✏️ Custom Theme\n🎨 No Theme\n[/SUGGEST]',
    E'[SUGGEST]\npaw-patrol: Paw Patrol\nfrozen: Frozen\npeppa-pig: Peppa Pig\nbluey: Bluey\ncocomelon: Cocomelon\nmoana: Moana\nmickey-mouse: Mickey Mouse\nmario: Mario\nsesame-street: Sesame Street\nbenji-davies: Benji Davies Style\nblack-and-white: Black & White\nbear-stories: Bear Stories\ncustom: Custom Theme\nno-theme: No Theme (Classic Educational)\n[/SUGGEST]'
  ),
  version_number = version_number + 1,
  what_changed = 'Fixed character theme format to use key: label format (e.g., paw-patrol: Paw Patrol) for proper thumbnail rendering in chat UI',
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-emotions' AND is_latest = true;

-- Fix Opposites agent character theme format to match ABC standard
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    E'[SUGGEST]\n🏔️ Mountain Village / 🐾 Paw Patrol / ❄️ Frozen / 🐷 Peppa Pig / 🐶 Bluey / 🎵 Cocomelon / 🌊 Moana / 🐭 Mickey Mouse / 🍄 Mario / 🎪 Sesame Street / 📚 Benji Davies Style / ⚫ Black & White / 🐻 Bear Stories / ✏️ Custom Theme\n[/SUGGEST]',
    E'[SUGGEST]\npaw-patrol: Paw Patrol\nfrozen: Frozen\npeppa-pig: Peppa Pig\nbluey: Bluey\ncocomelon: Cocomelon\nmoana: Moana\nmickey-mouse: Mickey Mouse\nmario: Mario\nsesame-street: Sesame Street\nbenji-davies: Benji Davies Style\nblack-and-white: Black & White\nbear-stories: Bear Stories\ncustom: Custom Theme\nno-theme: No Theme (Classic Educational)\n[/SUGGEST]'
  ),
  version_number = version_number + 1,
  what_changed = 'Fixed character theme format from slash-separated emoji format to key: label format (e.g., paw-patrol: Paw Patrol) for proper thumbnail rendering in chat UI',
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-opposites' AND is_latest = true;