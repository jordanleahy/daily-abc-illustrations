/**
 * Instruction Templates for Agent Creator
 * 
 * Reusable template blocks from the Book Type Agent Creation Guide (Appendix A)
 * These are merged with AI-generated type-specific content to produce complete agent instructions.
 */

// ============================================================================
// TEMPLATE BLOCKS
// ============================================================================

export const TEMPLATES = {
  // Header block with role definition
  header: (typeName: string, typeDescription: string) => `
# ${typeName} Book Creation Agent

You are a specialized ${typeName} book creation assistant for Chairlift Habits, an AI-powered children's educational book platform. Your role is to guide parents through creating personalized ${typeName.toLowerCase()} books for their toddlers and preschoolers.

${typeDescription}
`.trim(),

  // Character theme selection block
  characterThemeSelection: `
## Step 1: Character Theme Selection

Present character theme options using [SUGGEST] blocks:

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
no-theme: No Theme
[/SUGGEST]

Wait for user selection before proceeding.
`.trim(),

  // Grade level selection block
  gradeLevelSelection: `
## Step 2: Grade Level

Ask for the child's grade level using [SUGGEST] blocks:

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]

Wait for user selection before proceeding.
`.trim(),

  // Title and description approval block
  titleApproval: `
## Step 5: Title & Description Approval

Present a suggested book title and brief description based on user selections.
Ask for approval using [SUGGEST] blocks:

[SUGGEST]
approve: ✓ Looks great!
edit-title: Edit Title
edit-description: Edit Description
[/SUGGEST]

Only proceed to outline generation after explicit approval.
`.trim(),

  // Educational focus page template
  educationalFocusPage: (learningType: string, skillFocus: string) => `
## Educational Focus Page (Page 2)

Generate Page 2 with three vertically-stacked colorful badges:
- **Grade Level Badge** (teal background): Display selected grade level
- **Learning Type Badge** (coral background): "${learningType}"
- **Skill Focus Badge** (gold background): "${skillFocus}"

Image prompt for educational focus page must be 200-350 characters describing the badges with theme-specific styling.
`.trim(),

  // Cover page template
  coverPage: `
## Cover Page (Page 1)

Generate a cover page with:
- Book title prominently displayed
- Character theme integration (if selected)
- Engaging, colorful illustration

CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space.
`.trim(),

  // Image prompt requirements
  imagePromptRequirements: `
## Image Prompt Requirements

All image prompts must follow this structure (200-350 characters):

1. **Art Style Opening**: Identify theme/animation style
2. **Character Details**: Species, colors, clothing/features
3. **Action + Emotion**: What character does and how they feel
4. **Object with Colors**: Specific color adjectives (e.g., "bright red, shiny apple with green leaf")
5. **Simple Background**: Age-appropriate setting
6. **MANDATORY ENDING**: "No text overlays. Clean illustration only."

Exception: Cover pages end with the title display instruction instead.
`.trim(),

  // Output format block
  outputFormat: `
## Output Format

Generate outline using this exact markdown format:

**Page 1: [Cover Title]**
[Cover image prompt with title display instruction]

**Page 2: Educational Focus**
[Educational focus image prompt with badge descriptions]

**Page 3: [Content Title]**
[Content image prompt ending with "No text overlays. Clean illustration only."]

...continue for all content pages...

After generating the complete outline, return an empty suggestions array to trigger the QA panel.
`.trim(),

  // Fixed 12-page structure
  fixedPageStructure: `
## Book Structure

All books use a fixed 12-page structure:
- **Page 1**: Cover page
- **Page 2**: Educational Focus page
- **Pages 3-12**: Content pages (10 total)

Do NOT ask users to select page count. Always generate exactly 12 pages.
`.trim(),

  // Validation rules template
  validationRules: (rules: string[]) => `
## Validation Rules

${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

These rules must NEVER be violated. If content would violate a rule, regenerate until compliant.
`.trim(),
};

// ============================================================================
// ASSEMBLY FUNCTION
// ============================================================================

export interface AgentConfig {
  typeName: string;
  typeId: string;
  typeDescription: string;
  learningType: string;
  skillFocus: string;
  pageTitleFormat: string;
  pageTitleExamples: string[];
  discoveryQuestions: Array<{
    questionKey: string;
    questionText: string;
    options: Array<{ key: string; label: string }>;
  }>;
  validationRules: string[];
  contentPageGuidelines: string;
}

/**
 * Assembles complete agent instructions from templates and AI-generated config
 */
export function assembleAgentInstructions(config: AgentConfig): string {
  const sections: string[] = [];

  // 1. Header
  sections.push(TEMPLATES.header(config.typeName, config.typeDescription));

  // 2. Character theme selection
  sections.push(TEMPLATES.characterThemeSelection);

  // 3. Grade level selection
  sections.push(TEMPLATES.gradeLevelSelection);

  // 4. Type-specific discovery questions
  if (config.discoveryQuestions.length > 0) {
    const discoverySection = config.discoveryQuestions.map((q, i) => {
      const suggestBlock = q.options.map(o => `${o.key}: ${o.label}`).join('\n');
      return `
## Step ${3 + i}: ${q.questionText}

[SUGGEST]
${suggestBlock}
[/SUGGEST]

Wait for user selection before proceeding.
`.trim();
    }).join('\n\n');
    sections.push(discoverySection);
  }

  // 5. Title approval
  sections.push(TEMPLATES.titleApproval);

  // 6. Fixed page structure
  sections.push(TEMPLATES.fixedPageStructure);

  // 7. Cover page
  sections.push(TEMPLATES.coverPage);

  // 8. Educational focus page
  sections.push(TEMPLATES.educationalFocusPage(config.learningType, config.skillFocus));

  // 9. Content page guidelines (type-specific)
  sections.push(`
## Content Pages (Pages 3-12)

**Page Title Format**: ${config.pageTitleFormat}

**Examples**:
${config.pageTitleExamples.map(ex => `- ${ex}`).join('\n')}

${config.contentPageGuidelines}
`.trim());

  // 10. Image prompt requirements
  sections.push(TEMPLATES.imagePromptRequirements);

  // 11. Validation rules
  sections.push(TEMPLATES.validationRules(config.validationRules));

  // 12. Output format
  sections.push(TEMPLATES.outputFormat);

  return sections.join('\n\n---\n\n');
}

/**
 * Generates book_types table record from config
 */
export function generateBookTypeRecord(config: AgentConfig) {
  return {
    id: config.typeId,
    label: config.typeName,
    description: config.typeDescription,
    icon_name: 'BookOpen', // Default icon
    is_active: true,
    sort_order: 100, // Add at end
    expected_page_count: 12,
    needs_clarification: config.discoveryQuestions.length > 0,
    clarification_context: config.discoveryQuestions.length > 0 
      ? config.discoveryQuestions[0].questionText 
      : null,
  };
}

/**
 * Generates agents table record from config and assembled instructions
 */
export function generateAgentRecord(
  config: AgentConfig, 
  instructions: string,
  userId: string
) {
  return {
    name: `${config.typeName} Book Creation Agent`,
    type: `book-creation-${config.typeId}`,
    intent: `Create personalized ${config.typeName.toLowerCase()} books for children`,
    instructions,
    provider: 'google',
    model: 'google/gemini-2.5-flash',
    max_completion_tokens: 8000,
    top_p: 1.0,
    operational_status: 'online',
    is_latest: true,
    version: 'v1.0.0',
    version_number: 1,
    user_id: userId,
  };
}
