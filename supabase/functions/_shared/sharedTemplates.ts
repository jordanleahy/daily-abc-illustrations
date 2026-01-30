/**
 * Shared Templates Utility
 * 
 * Fetches and interpolates shared page templates for cover and educational pages.
 * Templates are cached with a 5-minute TTL to reduce database queries.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface SharedTemplate {
  template_key: string;
  content: string;
  version_number: number;
}

// Cache with 5-minute TTL
let cachedTemplates: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fallback templates for when database is unreachable
 * These match the seeded values but serve as a safety net
 */
const FALLBACK_TEMPLATES: Record<string, string> = {
  'cover': `## Cover Page (Page 1)

Generate a cover page with:
- Book title prominently displayed (MUST include "{{bookTypeWord}}" in the title)
- Character theme integration (if selected)
- Engaging, colorful illustration

⚠️ TITLE FORMAT (PRIORITY ORDER):
1. **With Resort:** "[Resort Name] {{bookTypeWord}}" (e.g., "Killington {{bookTypeWord}}")
2. **With City:** "[City] {{bookTypeWord}}" (e.g., "Jersey City {{bookTypeWord}}")
3. **Character Only:** "[Character]'s {{bookTypeWord}}" (e.g., "Bluey's {{bookTypeWord}}")

⚠️ FORBIDDEN TITLES:
- ❌ Verbose titles like "Magical Snowy Adventure at Killington"
- ❌ Titles longer than 5-6 words
- ❌ Titles without "{{bookTypeWord}}"

{{COVER_TITLE_INSTRUCTION}}`,

  'educational': `## Educational Focus Page (Page 2)

Generate Page 2 with three vertically-stacked colorful badges:
- **Grade Level Badge** (teal background): "{{gradeLevel}}"
- **Learning Type Badge** (coral background): "{{learningType}}"
- **Skill Focus Badge** (gold background): "{{skillFocus}}"

Image prompt for educational focus page must be 200-350 characters describing the badges with theme-specific styling. End with "No text overlays. Clean illustration only."`,

  'outline_format': `## CRITICAL: PAGE FORMAT RULES

When generating book outlines, you MUST use this EXACT format for each page:

**Page N: Title**
- Content description
- Additional details

### ✅ CORRECT FORMAT EXAMPLES:
\`\`\`
**Page 1: Cover**
- Book title prominently displayed

**Page 2: Educational Focus**
- Three colorful badges

**Page 3: [Cat] is for C**
- A playful cat character
\`\`\`

### ❌ FORBIDDEN FORMATS:
- NO markdown headings before page (### **Page N**)
- NO numbered lists (1. Page N:)
- NO plain text (Page N:) without bold
- NO variations in spacing or punctuation

### FORMAT ENFORCEMENT:
- Always use double asterisks: **Page N: Title**
- Always include colon after page number
- Title follows immediately after colon
- Content uses bullet points below title
- One blank line between pages`,
};

/**
 * Fetches shared templates from the database with caching
 */
export async function fetchSharedTemplates(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Return cached templates if still valid
  if (cachedTemplates && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('[SharedTemplates] Using cached templates');
    return cachedTemplates;
  }
  
  try {
    const { data, error } = await supabase
      .from('shared_page_templates')
      .select('template_key, content')
      .eq('is_active', true)
      .eq('is_latest', true);
      
    if (error) {
      console.error('[SharedTemplates] Database error:', error);
      return FALLBACK_TEMPLATES;
    }
    
    if (!data || data.length === 0) {
      console.warn('[SharedTemplates] No templates found, using fallbacks');
      return FALLBACK_TEMPLATES;
    }
    
    const templates: Record<string, string> = {};
    for (const row of data) {
      templates[row.template_key] = row.content;
    }
    
    // Update cache
    cachedTemplates = templates;
    cacheTimestamp = now;
    
    console.log(`[SharedTemplates] Loaded ${Object.keys(templates).length} templates from database`);
    return templates;
    
  } catch (err) {
    console.error('[SharedTemplates] Unexpected error:', err);
    return FALLBACK_TEMPLATES;
  }
}

/**
 * Interpolates placeholders in a template with actual values
 * 
 * @param template - The template string with {{placeholder}} syntax
 * @param values - Key-value pairs to substitute
 * @returns The interpolated string
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(values)) {
    // Use a regex to replace all occurrences of {{key}}
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * Gets a specific template by key, with interpolation
 */
export async function getInterpolatedTemplate(
  supabase: SupabaseClient,
  templateKey: 'cover' | 'educational',
  values: Record<string, string>
): Promise<string> {
  const templates = await fetchSharedTemplates(supabase);
  const template = templates[templateKey] || FALLBACK_TEMPLATES[templateKey];
  
  if (!template) {
    console.error(`[SharedTemplates] Template not found: ${templateKey}`);
    return '';
  }
  
  return interpolateTemplate(template, values);
}

/**
 * Clears the template cache (useful for testing or forcing refresh)
 */
export function clearTemplateCache(): void {
  cachedTemplates = null;
  cacheTimestamp = 0;
  console.log('[SharedTemplates] Cache cleared');
}
