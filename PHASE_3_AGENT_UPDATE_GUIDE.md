# Phase 3: Agent Prompt Updates - 12-Page Standardization

## Overview
Update all 11 specialized book creation agents to enforce fixed 12-page structure with standardized **Page N: Title** format.

## Agents to Update
1. ✅ Numbers (book-creation-numbers)
2. ✅ Rhyming (book-creation-rhyming) 
3. ✅ Colors (book-creation-colors)
4. ✅ Shapes (book-creation-shapes)
5. ✅ Opposites (book-creation-opposites)
6. ✅ Emotions (book-creation-emotions)
7. ✅ Animals (book-creation-animals)
8. ✅ First Words (book-creation-first-words)
9. ✅ Bedtime (book-creation-bedtime)
10. ✅ CVC (book-creation-cvc)
11. ✅ Sight Words (book-creation-sight-words)

**Skip:** ABC agent (already uses fixed 28-page structure)

---

## Required Changes Per Agent

### 1. Update Conversation Flow Header

**FIND:**
```
=== CONVERSATION FLOW ===

**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)
...
**Step 2: Age Group** (if not in context)
...
**Step 3: [Type-Specific Discovery]**
...
**Step 4: Page Count Confirmation**
...
**Step 5: Title & Description**
...
**Step 6-7: Draft → Complete**
```

**REPLACE WITH:**
```
=== CONVERSATION FLOW ===

**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)
...
**Step 2: Age Group** (if not in context)
...
**Step 3: [Type-Specific Discovery]**
...
**Step 4: Title & Description**
...
**Step 5-6: Draft → Complete**
```

**CHANGES:**
- Remove entire "Step 4: Page Count Confirmation" section
- Renumber remaining steps (Step 5 becomes Step 4, etc.)
- Update "Step 6-7" to "Step 5-6"

---

### 2. Add Fixed Book Structure Section

**ADD AFTER CONVERSATION FLOW (before type-specific rules):**

```
=== FIXED BOOK STRUCTURE ===

This book type always generates **exactly 12 total pages**:
- **Page 1**: Cover page with title and theme integration
- **Page 2**: Educational Focus page with three badge images
- **Pages 3-12**: Ten (10) content pages with [type-specific content]

CRITICAL FORMAT REQUIREMENT:
- ALL pages must use **Page N: Title** format
- Page numbering starts at 1 (not 0)
- Never skip page numbers
- Never ask users about page count - it's always fixed at 12 total pages

**Example Page Format:**
**Page 1: [Cover Title]**
[Image prompt 200-350 characters...]

**Page 2: Educational Focus**
[Badge descriptions...]

**Page 3: [Content Title]**
[Image prompt 200-350 characters...]

...

**Page 12: [Content Title]**
[Image prompt 200-350 characters...]
```

---

### 3. Update Page 2 Educational Focus Format

**FIND (if exists):**
```
**Page 2: Educational Focus Image**
```

**REPLACE WITH:**
```
**Page 2: Educational Focus**

Target Age: [from user selection]
Learning Type: [type-specific learning focus]
Specific Skill: [specific skill from discovery]

**Educational Focus Image:**
[Badge image prompt describing three vertically-stacked colorful badges]
```

**ENSURE SECTION INCLUDES:**
- Three badge fields (Age Range, Learning Type, Skill Focus)
- Single unified "Educational Focus" page (NOT separate text + image pages)
- Badge image prompt with theme integration

---

### 4. Update Step 6 (formerly Step 7) Outline Generation

**FIND:**
```
CRITICAL STEP 6 EXECUTION REQUIREMENT:
When user approves the title/description (Step 5 → Step 6)
```

**REPLACE WITH:**
```
CRITICAL STEP 5 EXECUTION REQUIREMENT:
When user approves the title/description (Step 4 → Step 5), your response message field MUST contain the COMPLETE 12-page outline immediately.

DO NOT respond with just "Generating the complete outline..." or acknowledgment text.

Your response message MUST include:
1. Brief confirmation (1 sentence max)
2. The COMPLETE outline with ALL 12 pages formatted exactly as:

**Page 1: [Cover Title]**
[Complete image prompt 200-350 characters]

**Page 2: Educational Focus**
Target Age: [from selection]
Learning Type: [type-specific]
Specific Skill: [from discovery]

**Educational Focus Image:**
[Badge prompt with three vertically-stacked badges]

**Page 3: [Content Title]**
[Complete image prompt 200-350 characters]

...

**Page 12: [Content Title]**
[Complete image prompt 200-350 characters]

The suggestions array must be empty [] since outline generation does not require buttons.

VALIDATION: Your response must contain exactly 12 "**Page" markers (Page 1 through Page 12). If it does not, you have failed to generate the outline correctly.
```

---

### 5. Remove Any Page Count Selection Logic

**SEARCH FOR AND DELETE:**
- Any "Step 4: Page Count Confirmation" sections
- Any [SUGGEST] blocks with "pages-5", "pages-10", "pages-15", "pages-20"
- Any references to "confirmedPageCount"
- Any age-based page count recommendations
- Any language about "choosing how many pages"

---

### 6. Update Example Outlines (if present)

**FIND any example outlines and ensure they show:**
- Exactly 12 pages total
- **Page 1: [Title]** format (not "Cover:" or other variants)
- **Page 2: Educational Focus** with badge structure
- **Pages 3-12:** content pages with proper numbering

---

### 7. Type-Specific Content Adjustments

Each agent may need slight modifications to reflect "10 content pages":

**Numbers:** "10 consecutive numbers" (e.g., 1-10, 11-20, etc.)
**Rhyming:** "10 rhyming content pages" (AABB couplets)
**Colors:** "10 colors" (primary, secondary, and additional colors)
**Shapes:** "10 shapes" (basic through advanced as age-appropriate)
**Opposites:** "5 opposite pairs = 10 content pages" (e.g., Big/Small, Hot/Cold, etc.)
**Emotions:** "10 emotions" (happy, sad, angry, scared, excited, etc.)
**Animals:** "10 animals" (from selected category)
**First Words:** "10 common words" (everyday vocabulary)
**Bedtime:** "10 bedtime routine steps" (brush teeth, bath, pajamas, etc.)
**CVC:** "10 CVC words" (cat, dog, sun, bat, etc.)
**Sight Words:** "10 sight words" (from selected grade level)

---

## Validation Checklist Per Agent

After updating each agent, verify:

- [ ] No "Step 4: Page Count Confirmation" section exists
- [ ] Conversation flow is renumbered correctly (6 steps total, not 7)
- [ ] "FIXED BOOK STRUCTURE" section added with 12-page specification
- [ ] All example outlines show **Page N:** format (N = 1-12)
- [ ] Page 2 shows unified "Educational Focus" with badges
- [ ] Step 5 (outline generation) specifies "exactly 12 pages"
- [ ] No [SUGGEST] blocks with "pages-X" button IDs
- [ ] Type-specific rules reflect "10 content pages"
- [ ] All page numbering examples use 1-based indexing (Page 1, not Page 0)

---

## Update Process

1. Navigate to `/agents` in admin UI
2. Find agent by type (e.g., "book-creation-numbers")
3. Click "Edit" on the latest version
4. Apply all 7 changes listed above
5. Save updated agent
6. Verify in test conversation that:
   - No page count selection appears
   - Outline generates exactly 12 pages
   - All pages use **Page N:** format
7. Repeat for all 11 agents

---

## Testing After Updates

Create a test book for each type and verify:

1. ✅ Character theme selection works (Step 1)
2. ✅ Age selection works if not skipped (Step 2)
3. ✅ Type-specific discovery works (Step 3)
4. ✅ **NO page count selection appears**
5. ✅ Title approval works (Step 4)
6. ✅ Complete 12-page outline generates (Step 5)
7. ✅ QA panel auto-opens when 12th page is drafted
8. ✅ All pages use **Page 1:**, **Page 2:**, etc. format
9. ✅ Page 2 has Educational Focus badges
10. ✅ Pages 3-12 have type-specific content

---

## Completion Criteria

- [ ] All 11 agents updated in database
- [ ] Test book created for each type
- [ ] All outlines generate exactly 12 pages
- [ ] QA panel auto-opens correctly for all types
- [ ] No page count selection step appears
- [ ] All page titles use **Page N:** format consistently
