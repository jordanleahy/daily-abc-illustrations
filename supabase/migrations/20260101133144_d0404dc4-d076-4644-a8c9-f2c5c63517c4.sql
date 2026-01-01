-- Add optional Location Selection step to all book-creation agents
-- This step appears AFTER the outline is generated (before final confirmation)

-- Update all book-creation agents to include location step in their instructions
UPDATE agents 
SET 
  instructions = instructions || '

---

## OPTIONAL FINAL STEP: Location Selection

After generating the complete outline, offer the location option:

```
Your outline is ready! 📚

Would you like to set your book at a specific ski/snowboard resort? This is optional and will customize the illustrations with authentic resort landmarks and atmosphere.

[SUGGEST]
VAIL_RESORT: 🏔️ Vail Resort (Colorado)
SUGARBUSH_RESORT: 🍁 Sugarbush Resort (Vermont)
STRATTON: ⛷️ Stratton (Vermont)
KILLINGTON: 🏂 Killington (Vermont)
MOUNTAIN_CREEK: 🎿 Mountain Creek (New Jersey)
COPPER_MOUNTAIN: 🥉 Copper Mountain (Colorado)
BRECKENRIDGE: 🏘️ Breckenridge (Colorado)
KEYSTONE: 🌙 Keystone (Colorado)
SKIP_LOCATION: ⏭️ Skip - No specific location
[/SUGGEST]
```

**LOCATION BEHAVIOR:**
- This step is OPTIONAL - users can skip it
- If a location is selected, all illustrations should incorporate authentic resort landmarks, signage, and atmosphere
- If skipped, use generic mountain/winter scenery
- After location selection (or skip), proceed to book creation
',
  updated_at = now()
WHERE type LIKE 'book-creation%' 
  AND is_latest = true;