import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';

const documentationContent = `# Book-Type Agent Creation Guide

> **Purpose**: Reference document for creating new specialized book creation agents  
> **Last Updated**: 2024-12-04  
> **Working Examples**: ABC Agent, Rhyming Agent

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Agent Structure Specification](#2-agent-structure-specification)
3. [Section-by-Section Guide](#3-section-by-section-guide)
4. [Decision Framework](#4-decision-framework)
5. [Validation Checklist](#5-validation-checklist)
6. [Appendix A: Copy-Paste Blocks](#appendix-a-copy-paste-blocks)
7. [Appendix B: Working Examples](#appendix-b-working-examples)

---

## 1. Architecture Overview

### 1.1 What is a Book-Type Agent?

A specialized AI agent that guides users through creating a specific type of children's educational book. Each agent:
- Conducts discovery conversations to gather requirements
- Generates structured book outlines with page titles and image prompts
- Enforces type-specific educational rules and content formats

### 1.2 Agent Composition

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    AGENT INSTRUCTIONS                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │           SHARED SECTIONS (~75%)                     │    │
│  │  • Header & Role Definition                          │    │
│  │  • Core Principles                                   │    │
│  │  • Character Theme Selection                         │    │
│  │  • Age Group Selection                               │    │
│  │  • Title/Description Approval                        │    │
│  │  • Image Prompt Requirements                         │    │
│  │  • Cover Page Format                                 │    │
│  │  • Educational Focus Badge Format                    │    │
│  │  • Output Format & Suggestions                       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           TYPE-SPECIFIC SECTIONS (~25%)              │    │
│  │  • Type-Specific Discovery Questions                 │    │
│  │  • Page Count & Structure                            │    │
│  │  • Content Page Format                               │    │
│  │  • Educational Badge Content                         │    │
│  │  • Validation Rules                                  │    │
│  │  • Curated Content Lists (if applicable)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 1.3 Conversation Flow (Universal)

All agents follow this 6-step flow:

| Step | Purpose | User Action |
|------|---------|-------------|
| 1 | Character Theme Selection | Click [SUGGEST] button |
| 2 | Age Group Selection | Click [SUGGEST] button |
| 3 | Type-Specific Discovery | Click [SUGGEST] button(s) |
| 4 | Title/Description Approval | Approve or request changes |
| 5 | Outline Generation | Automatic (no user action) |
| 6 | QA Panel Auto-Opens | Review generated outline |

---

## 2. Agent Structure Specification

### 2.1 Required Sections (In Order)

Every agent instruction must contain these sections in this order:

\`\`\`
1. HEADER & ROLE
2. CORE PRINCIPLES  
3. CONVERSATION FLOW
   3a. Step 1: Character Theme
   3b. Step 2: Age Group
   3c. Step 3: Type-Specific Discovery (CUSTOMIZE)
   3d. Step 4: Title/Description Approval
   3e. Step 5: Complete Outline Generation
4. PAGE FORMATS
   4a. Cover Page (Page 1)
   4b. Educational Focus Page (Page 2)
   4c. Content Pages (Page 3+) (CUSTOMIZE)
5. IMAGE PROMPT REQUIREMENTS
6. VALIDATION RULES (CUSTOMIZE)
7. OUTPUT FORMAT
\`\`\`

### 2.2 Database Configuration

When creating an agent, these database fields must be set:

| Field | Value | Notes |
|-------|-------|-------|
| \`type\` | \`book-creation-{typename}\` | e.g., \`book-creation-abc\` |
| \`name\` | \`{TypeName} Book Creation Agent\` | e.g., \`ABC Book Creation Agent\` |
| \`intent\` | Description of what agent creates | e.g., \`Creates ABC alphabet books...\` |
| \`model\` | \`google/gemini-2.5-flash\` | **Required** - reasoning models fail |
| \`max_completion_tokens\` | \`12000\` (28 pages) or \`8000\` (12 pages) | Based on page count |
| \`top_p\` | \`0.95\` | Standard creativity setting |
| \`provider\` | \`google\` | Default provider |
| \`is_latest\` | \`true\` | Mark as active version |

### 2.3 Frontend Configuration

Update \`src/config/bookTypes.ts\`:

\`\`\`typescript
{
  id: 'typename',
  label: 'Type Display Name',
  prompt: 'I want to create a {typename} book',
  icon: IconComponent,
  expectedPageCount: 12, // or 28 for ABC
}
\`\`\`

Update \`src/types/shared/agent.ts\`:

\`\`\`typescript
// Add to AgentType enum
| 'book-creation-typename'

// Add to BOOK_TYPE_TO_AGENT_TYPE mapping
typename: 'book-creation-typename',
\`\`\`

---

## 3. Section-by-Section Guide

### 3.1 Header & Role

**Purpose**: Establishes agent identity and primary responsibility.

**Format**:
\`\`\`
# {TypeName} Book Creation Agent

You are the {TypeName} Book Creation Agent for Chairlift Habits. Your role is to guide parents through creating {description of book type} for children ages {age range}.
\`\`\`

**Key Decisions**:
- What age range does this book type target?
- What is the core educational purpose?

---

### 3.2 Core Principles

**Purpose**: Universal rules that apply to ALL book types.

**Always Include** (copy from Appendix A):
- Age-appropriate language
- Educational value in every page
- Consistent character integration
- No scary or inappropriate content
- Simple, clear instructions

---

### 3.3 Character Theme Selection (Step 1)

**Purpose**: Let users choose a visual theme for illustrations.

**Format**: Use exact [SUGGEST] block from Appendix A.

**Why This Matters**:
- \`key: label\` format is **required** for thumbnail rendering
- Emoji-only format breaks the parser
- All 14 themes must be included

---

### 3.4 Age Group Selection (Step 2)

**Purpose**: Tailor vocabulary and complexity to child's age.

**Format**: Use exact [SUGGEST] block from Appendix A.

**Age Groups** (standard across all agents):
- 1-2 years: Simple words, basic concepts
- 2-3 years: Short sentences, familiar objects
- 3-4 years: Longer sentences, more detail
- 4-5 years: Complex ideas, richer vocabulary

---

### 3.5 Type-Specific Discovery (Step 3) ⚡ CUSTOMIZE

**Purpose**: Gather information unique to this book type.

**Decision Framework**:

| Question | ABC Example | Rhyming Example | Your Agent |
|----------|-------------|-----------------|------------|
| What choices define this type? | Letter case, Subject theme | Rhyme theme | ? |
| How many discovery questions? | 2 | 1 | 1-3 max |
| Are choices mutually exclusive? | Yes (lowercase OR uppercase) | Yes | Usually yes |

**Format Template**:
\`\`\`
### Step 3: {Discovery Topic}

Present options via [SUGGEST] block:

[SUGGEST]
option1-key: Option 1 Label
option2-key: Option 2 Label
option3-key: Option 3 Label
[/SUGGEST]
\`\`\`

**Examples**:
- ABC: Letter case (lowercase/uppercase/mixed), Subject theme (animals/food/vehicles)
- Rhyming: Rhyme theme (adventure/bedtime/animals/nature)
- Numbers: Number range (1-5/1-10/1-20)
- Colors: Color set (primary/rainbow/nature)

---

### 3.6 Title/Description Approval (Step 4)

**Purpose**: User confirms book direction before outline generation.

**Format**: Use exact [SUGGEST] block from Appendix A.

**Options** (standard):
- \`approve: ✅ Looks great, let's continue!\`
- \`edit-title: ✏️ I'd like to change the title\`
- \`edit-description: 📝 I'd like to change the description\`

---

### 3.7 Outline Generation (Step 5)

**Purpose**: Generate complete book outline in single response.

**Critical Requirements**:
1. Generate ALL pages in ONE response
2. Use \`**Page N: Title**\` format
3. Include image prompt for each page
4. Empty suggestions array (no user input needed)

**Page Count by Type**:
| Type | Total Pages | Structure |
|------|-------------|-----------|
| ABC | 28 | 1 cover + 1 education + 26 letters |
| All Others | 12 | 1 cover + 1 education + 10 content |

---

### 3.8 Cover Page Format (Page 1)

**Purpose**: Book cover with title displayed prominently.

**Format**: Use exact template from Appendix A.

**Critical**: Cover page image prompt MUST include title display instruction, NOT "No text overlays."

---

### 3.9 Educational Focus Page (Page 2)

**Purpose**: Display three colorful badges showing learning focus.

**Badge Structure** (customize content):
\`\`\`
Badge 1 (Teal): Age Range - "{selected age}"
Badge 2 (Coral): Learning Type - "{type-specific}" 
Badge 3 (Gold): Focus Area - "{type-specific}"
\`\`\`

**Examples**:
| Type | Badge 2 (Learning Type) | Badge 3 (Focus Area) |
|------|------------------------|---------------------|
| ABC | Alphabet Recognition | {Letter Case} Letters |
| Rhyming | Phonemic Awareness | Rhyming Patterns |
| Numbers | Number Recognition | Counting 1-10 |
| Colors | Color Recognition | Primary Colors |

---

### 3.10 Content Page Format (Page 3+) ⚡ CUSTOMIZE

**Purpose**: Define the structure of educational content pages.

**Decision Framework**:

| Question | Your Answer |
|----------|-------------|
| What is the page title format? | e.g., \`(a) is for apple\` or \`Big / Small\` |
| What content appears on each page? | e.g., One letter + word + object |
| Is there a sequence/progression? | e.g., A-Z, 1-10, color wheel |
| What makes each page unique? | e.g., Different letter, different opposite pair |

**Format Examples**:

**ABC**:
\`\`\`
**Page 3: (a) is for apple**
Image Prompt: [Art style]. [Character] holding a bright red apple...
\`\`\`

**Rhyming**:
\`\`\`
**Page 3: The sun begins to shine so bright, / Moana wakes up with all her might**
Image Prompt: [Art style]. [Character] stretching in morning sunlight...
\`\`\`

**Opposites**:
\`\`\`
**Page 3: Big / Small**
Image Prompt: [Art style]. Split scene showing [Character] next to big elephant, then next to small mouse...
\`\`\`

---

### 3.11 Image Prompt Requirements

**Purpose**: Ensure consistent, high-quality image generation.

**Universal Requirements** (copy from Appendix A):
- 200-350 characters
- Art style opening
- Character details
- Action + emotion
- Objects with colors
- Simple background
- **Ending**: "Full frame. No text overlays. Clean illustration only."

**Cover Page Exception**: Replace ending with title display instruction.

---

### 3.12 Validation Rules ⚡ CUSTOMIZE

**Purpose**: Type-specific rules the agent must enforce.

**Examples**:

**ABC**:
- Every letter A-Z must appear exactly once
- Letter case must match user selection
- Page titles use \`(letter) is for word\` format

**Rhyming**:
- Each page must contain internal rhyme (not across pages)
- AABB couplet structure only
- Title format: \`Line 1 / Line 2\`

**Numbers**:
- Use numeric digits (1, 2, 3) never words (one, two, three)
- Sequential progression
- Same counting object throughout

---

## 4. Decision Framework

Use this framework when creating a new agent:

### 4.1 Core Identity Questions

1. **What educational concept does this book teach?**
   - Example: ABC teaches letter recognition

2. **What age range is the primary target?**
   - Most: 1-5 years
   - Some: 4-8 years (CVC, Sight Words)

3. **What makes this book type unique?**
   - Example: ABC has 26 fixed pages (one per letter)

### 4.2 Structure Questions

4. **How many content pages?**
   - Fixed count (like ABC = 26)?
   - Standard count (10)?

5. **Is there a progression/sequence?**
   - Alphabetical (ABC)
   - Numerical (Numbers)
   - Thematic (Emotions)
   - None (Colors, Shapes)

6. **What is the page title format?**
   - See examples in 3.10

### 4.3 Discovery Questions

7. **What type-specific choices does the user need to make?**
   - Usually 1-2 choices max
   - Must be presentable as [SUGGEST] buttons

8. **Are there curated content lists?**
   - ABC: Subject themes (animals, food, etc.)
   - Rhyming: Pre-written rhyme pairs
   - Numbers: Counting objects

### 4.4 Validation Questions

9. **What rules must NEVER be broken?**
   - ABC: All 26 letters present
   - Rhyming: Lines must actually rhyme
   - Numbers: Digits not words

10. **What content is inappropriate for this type?**
    - Scary content
    - Complex vocabulary for young ages
    - Content that doesn't match the educational goal

---

## 5. Validation Checklist

Before deploying a new agent, verify:

### 5.1 Structure Validation
- [ ] Header identifies agent name and purpose
- [ ] All 6 conversation steps documented
- [ ] Character theme uses exact [SUGGEST] format with \`key: label\`
- [ ] Age groups use exact [SUGGEST] format
- [ ] Type-specific discovery uses [SUGGEST] format
- [ ] Title approval uses exact [SUGGEST] format
- [ ] Page formats documented (Cover, Education, Content)
- [ ] Image prompt requirements included
- [ ] Validation rules defined

### 5.2 Content Validation
- [ ] Cover page includes title display instruction
- [ ] Educational badges have all three badges defined
- [ ] Content page format is clearly specified
- [ ] Image prompts end with "Full frame. No text overlays. Clean illustration only."
- [ ] All curated content lists included (if applicable)

### 5.3 Technical Validation
- [ ] \`type\` field matches \`book-creation-{typename}\` pattern
- [ ] \`model\` is \`google/gemini-2.5-flash\`
- [ ] \`max_completion_tokens\` sufficient for page count
- [ ] \`bookTypes.ts\` updated with \`expectedPageCount\`
- [ ] \`agent.ts\` updated with type mapping

### 5.4 Testing Validation
- [ ] Agent responds with [SUGGEST] blocks (not raw JSON)
- [ ] Character theme thumbnails render correctly
- [ ] All discovery steps complete successfully
- [ ] Outline generates correct number of pages
- [ ] QA panel auto-opens when outline complete
- [ ] Page titles follow specified format
- [ ] Image prompts meet length requirements

---

## Appendix A: Copy-Paste Blocks

### A.1 Header Template

\`\`\`
# {TypeName} Book Creation Agent

You are the {TypeName} Book Creation Agent for Chairlift Habits. Your role is to guide parents through creating personalized {description} books for children ages {age-range}.

## Core Principles

1. **Age-Appropriate Content**: All content must be suitable for young children
2. **Educational Value**: Every page should teach or reinforce {learning-concept}
3. **Character Integration**: Seamlessly incorporate the selected character theme
4. **Visual Clarity**: Image prompts must be detailed and specific
5. **Consistent Format**: Follow the exact page structure defined below
\`\`\`

### A.2 Character Theme Selection Block

\`\`\`
### Step 1: Character Theme Selection

Present these options via [SUGGEST] block:

[SUGGEST]
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
no-theme: No Theme (Classic Style)
[/SUGGEST]

If user selects "custom", ask them to describe their preferred theme.
If user selects "no-theme", use classic educational illustration style.
\`\`\`

### A.3 Age Group Selection Block

\`\`\`
### Step 2: Age Group Selection

Present these options via [SUGGEST] block:

[SUGGEST]
age-1-2: 1-2 years (Simple words, basic concepts)
age-2-3: 2-3 years (Short sentences, familiar objects)
age-3-4: 3-4 years (Longer sentences, more detail)
age-4-5: 4-5 years (Complex ideas, richer vocabulary)
[/SUGGEST]
\`\`\`

### A.4 Title/Description Approval Block

\`\`\`
### Step 4: Title and Description Approval

After gathering all information, present a suggested title and brief description.

Example:
> **Suggested Title**: "{Book Title}"
> **Description**: "{Brief description of the book}"

Then present approval options via [SUGGEST] block:

[SUGGEST]
approve: ✅ Looks great, let's continue!
edit-title: ✏️ I'd like to change the title
edit-description: 📝 I'd like to change the description
[/SUGGEST]
\`\`\`

### A.5 Cover Page Template

\`\`\`
### Cover Page Format (Page 1)

**Page 1: Cover**

Image Prompt: {Art style} cover illustration. {Character} in a {setting} with {theme elements}. Bright, cheerful colors with {color palette}. CRITICAL INSTRUCTION: Display the book title "{BOOK_TITLE}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Full frame.
\`\`\`

### A.6 Educational Focus Page Template

\`\`\`
### Educational Focus Page Format (Page 2)

**Page 2: Educational Focus**

Image Prompt: {Art style} educational badge display. Three vertically-stacked colorful badges on a soft {background color} background: 
- Top badge (teal): "{Age Range}" 
- Middle badge (coral): "{Learning Type}" 
- Bottom badge (gold/yellow): "{Focus Area}"
{Optional: Badge shapes matching character theme - e.g., Mickey ears for Mickey Mouse, snowflakes for Frozen}
Full frame. No text overlays. Clean illustration only.
\`\`\`

### A.7 Image Prompt Requirements Block

\`\`\`
## Image Prompt Requirements

All image prompts must:
- Be 200-350 characters in length
- Begin with art style identification
- Include character details (species, colors, clothing)
- Describe action and emotion
- Specify object colors explicitly (e.g., "bright red apple with green leaf")
- Include simple, age-appropriate background
- End with: "Full frame. No text overlays. Clean illustration only."

**Exception**: Cover page (Page 1) ends with title display instruction instead.
\`\`\`

### A.8 Output Format Block

\`\`\`
## Output Format

All responses must follow this JSON structure:

{
  "message": "Your conversational response here",
  "suggestions": ["option1-key: Option 1 Label", "option2-key: Option 2 Label"],
  "metadata": {
    "currentStep": "step-name",
    "confirmedPageCount": 12
  }
}

**Important**: 
- Use [SUGGEST]...[/SUGGEST] blocks in the message for button rendering
- suggestions array should mirror the [SUGGEST] block content
- Empty suggestions array for outline generation (Step 5)
\`\`\`

### A.9 Standard 12-Page Structure Block

\`\`\`
## Book Structure (12 Pages)

- **Page 1**: Cover
- **Page 2**: Educational Focus
- **Pages 3-12**: Content Pages (10 total)

Total: 12 pages
expectedPageCount in bookTypes.ts: 12
max_completion_tokens: 8000
\`\`\`

### A.10 ABC 28-Page Structure Block

\`\`\`
## Book Structure (28 Pages - ABC Only)

- **Page 1**: Cover
- **Page 2**: Educational Focus  
- **Pages 3-28**: Letter Pages (A-Z, 26 total)

Total: 28 pages
expectedPageCount in bookTypes.ts: 28
max_completion_tokens: 12000
\`\`\`

---

## Appendix B: Working Examples

### B.1 ABC Agent - Type-Specific Discovery

\`\`\`
### Step 3a: Letter Case Selection

[SUGGEST]
lowercase: lowercase letters (a, b, c)
uppercase: UPPERCASE LETTERS (A, B, C)
mixed: Mixed Case (Aa, Bb, Cc)
[/SUGGEST]

### Step 3b: Subject Theme Selection

[SUGGEST]
mountain-village: 🏔️ Mountain Village A-Z
animals: 🐾 Animals A-Z
food: 🍎 Food & Fruits A-Z
vehicles: 🚗 Things That Go A-Z
mixed: 🎨 Classic Mixed Objects
snowboarding: 🏂 Snowboarding A-Z
custom: ✏️ Custom Theme
[/SUGGEST]
\`\`\`

### B.2 ABC Agent - Content Page Format

\`\`\`
### Content Pages Format (Pages 3-28)

Each letter page follows this format:

**Page {N}: ({letter}) is for {word}**

Image Prompt: {Art style}. {Character} interacting with {object}. {Character details - species, colors, expression}. The {object} is {color and detail description}. {Simple background setting}. Full frame. No text overlays. Clean illustration only.

**Example**:
**Page 3: (a) is for apple**
Image Prompt: Moana animation style. Young Moana holding a bright red apple with a green leaf, smiling warmly. She wears her traditional red and tan outfit. Soft beach background with palm trees. Full frame. No text overlays. Clean illustration only.
\`\`\`

### B.3 Rhyming Agent - Type-Specific Discovery

\`\`\`
### Step 3: Rhyme Theme Selection

[SUGGEST]
adventure: 🌟 Adventure & Exploration
bedtime: 🌙 Bedtime & Dreams
animals: 🐾 Animal Friends
nature: 🌸 Nature & Seasons
[/SUGGEST]
\`\`\`

### B.4 Rhyming Agent - Content Page Format

\`\`\`
### Content Pages Format (Pages 3-12)

Each rhyming page follows this format:

**Page {N}: {Rhyming Line 1} / {Rhyming Line 2}**

The title contains the complete AABB couplet with internal rhyme.

Image Prompt: {Art style}. {Character} {action from the rhyme}. {Character details}. {Scene matching the rhyme content}. Full frame. No text overlays. Clean illustration only.

**Example**:
**Page 3: The sun begins to shine so bright, / Moana wakes up with all her might**
Image Prompt: Moana animation style. Young Moana stretching and yawning in her hut as golden morning sunlight streams through the window. She looks excited for the day ahead. Cozy island bedroom with woven decorations. Full frame. No text overlays. Clean illustration only.
\`\`\`

### B.5 Rhyming Agent - Validation Rules

\`\`\`
## Validation Rules

1. **Self-Contained Rhymes**: Each page title must contain a complete rhyme within itself. Rhymes must NOT span across multiple pages.

2. **AABB Structure**: Use couplet format where both lines rhyme (bright/might, day/play, etc.)

3. **Title Format**: Always use "Line 1 / Line 2" format with forward slash separator

4. **True Rhymes**: End words must actually rhyme (same ending sound). Near-rhymes are not acceptable.

5. **Age-Appropriate Vocabulary**: Words must match the selected age group's comprehension level.

**Correct Example**:
Page 3: "The cat in a hat sat on the mat"
(Self-contained rhyme: hat/sat/mat)

**Incorrect Example**:
Page 3: "The cat sat down" + Page 4: "Upon the mat"
(Rhyme split across pages - NOT allowed)
\`\`\`

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-04 | Initial creation based on ABC and Rhyming agent analysis |
`;

export const AgentDocumentation = () => {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="prose prose-sm dark:prose-invert max-w-none px-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {documentationContent}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
};
