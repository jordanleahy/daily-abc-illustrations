
# Recommendation: Approach A (Database-Driven Shared Templates) is Best

## Why Approach A is the Correct Choice

Based on your requirement for **UI-editable shared prompts**, here's the comparison:

| Criteria | Approach A: DB Templates | Approach B: Code Assembler | Approach C: Fragments |
|----------|-------------------------|---------------------------|----------------------|
| **UI Editing** | ✅ Full UI editing | ❌ Requires code deploy | ✅ Full UI editing |
| **Complexity** | ⭐⭐ Medium | ⭐ Simple | ⭐⭐⭐ High |
| **Versioning** | ✅ Built-in | ❌ Git only | ✅ Built-in |
| **Real-time Updates** | ✅ Yes | ❌ No | ✅ Yes |
| **A/B Testing** | ✅ Easy | ❌ Hard | ✅ Easy |
| **Risk of Drift** | None | Medium | None |
| **Fits Existing Patterns** | ✅ Matches agents UI | ❌ Different pattern | ⚠️ New complexity |

**Approach A wins** because:
1. You already have a proven admin UI pattern for editing agents (AgentIdentityCard, ConfigurationTabs)
2. You already have versioned tables (`book_system_prompts`, `page_system_prompts`) as precedent
3. Real-time subscriptions are already implemented for agents and book types
4. It's simpler than Approach C while still being fully UI-editable

Approach C (Fragments) is overkill unless you need granular A/B testing of individual prompt sentences.

---

## Implementation Plan

### Phase 1: Create Database Schema

Create a new `shared_page_templates` table to store cover and educational page templates:

```sql
CREATE TABLE shared_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,           -- 'cover' or 'educational'
  version_number INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,                -- The template with {{placeholders}}
  is_latest BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  change_notes TEXT,                    -- What changed in this version
  
  UNIQUE(template_key, version_number)
);

-- Enable RLS
ALTER TABLE shared_page_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage shared templates" ON shared_page_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates" ON shared_page_templates
  FOR SELECT USING (is_active = true AND is_latest = true);
```

### Phase 2: Seed Initial Templates

Insert the canonical cover and educational templates:

**Cover Template** (`template_key = 'cover'`):
```
## Cover Page (Page 1)

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

{{COVER_TITLE_INSTRUCTION}}
```

**Educational Template** (`template_key = 'educational'`):
```
## Educational Focus Page (Page 2)

Generate Page 2 with three vertically-stacked colorful badges:
- **Grade Level Badge** (teal background): "{{gradeLevel}}"
- **Learning Type Badge** (coral background): "{{learningType}}"
- **Skill Focus Badge** (gold background): "{{skillFocus}}"

Image prompt for educational focus page must be 200-350 characters describing the badges with theme-specific styling. End with "No text overlays. Clean illustration only."
```

### Phase 3: Create Admin UI Components

**New Route**: `/admin/shared-templates`

**New Components**:
- `SharedTemplatesManager.tsx` - List view with edit buttons
- `SharedTemplateEditor.tsx` - Markdown editor with live preview and placeholder validation
- `TemplateVersionHistory.tsx` - View/restore previous versions

The UI will follow the existing `AgentIdentityCard` pattern:
- Inline editing with InlineEditTextarea
- Version display and history
- Character counter
- Placeholder validation (shows which `{{placeholders}}` are available)

### Phase 4: Update Backend to Fetch Shared Templates

Create `supabase/functions/_shared/sharedTemplates.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

interface SharedTemplate {
  template_key: string;
  content: string;
  version_number: number;
}

// Cache with 5-minute TTL
let cachedTemplates: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchSharedTemplates(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, string>> {
  const now = Date.now();
  
  if (cachedTemplates && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTemplates;
  }
  
  const { data, error } = await supabase
    .from('shared_page_templates')
    .select('template_key, content')
    .eq('is_active', true)
    .eq('is_latest', true);
    
  if (error) {
    console.error('[SharedTemplates] Failed to fetch:', error);
    return FALLBACK_TEMPLATES;
  }
  
  const templates: Record<string, string> = {};
  for (const row of data || []) {
    templates[row.template_key] = row.content;
  }
  
  cachedTemplates = templates;
  cacheTimestamp = now;
  
  return templates;
}

// Fallback for when DB is unreachable
const FALLBACK_TEMPLATES: Record<string, string> = {
  'cover': `## Cover Page (Page 1)...`, // Static fallback
  'educational': `## Educational Focus Page (Page 2)...`, // Static fallback
};

/**
 * Interpolates placeholders in template with actual values
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
```

### Phase 5: Update Agent Instructions Migration

Create an edge function `update-agents-with-shared-templates` that:

1. Fetches all book-creation agents
2. Removes embedded cover/educational sections
3. Replaces with placeholder references: `{{SHARED_COVER_TEMPLATE}}` and `{{SHARED_EDUCATIONAL_TEMPLATE}}`
4. Reduces instruction bloat by ~40%

### Phase 6: Update google-chat Edge Function

Modify the agent instruction injection to:

1. Fetch shared templates from database
2. Interpolate placeholders with book-type-specific values
3. Inject into agent context before calling AI

```typescript
// In google-chat/index.ts
const sharedTemplates = await fetchSharedTemplates(supabase);
const bookTypeConfig = BOOK_TYPE_TITLE_WORDS[bookType] || { word: 'Adventure' };

const resolvedInstructions = agent.instructions
  .replace('{{SHARED_COVER_TEMPLATE}}', interpolateTemplate(
    sharedTemplates['cover'],
    { bookTypeWord: bookTypeConfig.word, COVER_TITLE_INSTRUCTION }
  ))
  .replace('{{SHARED_EDUCATIONAL_TEMPLATE}}', interpolateTemplate(
    sharedTemplates['educational'],
    { gradeLevel, learningType, skillFocus }
  ));
```

### Phase 7: Add Real-time Subscription

Create `useSharedTemplatesSubscription.ts`:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSharedTemplatesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('shared-templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_page_templates',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_create_shared_page_templates.sql` | Database table and seed data |
| `src/pages/admin/SharedTemplates.tsx` | Admin UI page |
| `src/components/admin/SharedTemplatesManager.tsx` | Template list and management |
| `src/components/admin/SharedTemplateEditor.tsx` | Template editing with preview |
| `src/hooks/useSharedTemplates.ts` | Query hook for fetching templates |
| `src/hooks/useSharedTemplatesSubscription.ts` | Real-time subscription hook |
| `supabase/functions/_shared/sharedTemplates.ts` | Backend template fetching utility |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/google-chat/index.ts` | Fetch and interpolate shared templates |
| `supabase/functions/_shared/instructionTemplates.ts` | Remove duplicate template code, use shared templates |
| `agents` table (17+ records) | Replace embedded sections with placeholder references |
| `src/App.tsx` or routing | Add `/admin/shared-templates` route |

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Cover page definitions | 17+ copies across agents | 1 shared template (UI-editable) |
| Educational page definitions | 17+ copies across agents | 1 shared template (UI-editable) |
| Average agent instruction size | ~3,000 chars | ~1,800 chars |
| Time to update cover format | ~1 hour (edit 17 agents) | ~1 minute (edit 1 template) |
| Update propagation | Immediate per agent | Real-time via subscription |
| Version history | Per-agent | Centralized with rollback |

---

## Admin UI Preview

The new `/admin/shared-templates` page will show:

```
┌─────────────────────────────────────────────────────────────┐
│  Shared Page Templates                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 Cover Page Template                    v3 (Latest)│    │
│  │ Last updated: 2 hours ago                            │    │
│  │ [Edit] [View History] [Preview]                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 Educational Focus Template             v2 (Latest)│    │
│  │ Last updated: 3 days ago                             │    │
│  │ [Edit] [View History] [Preview]                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Available Placeholders:                                     │
│  • {{bookTypeWord}} - The book type display word             │
│  • {{gradeLevel}} - Selected grade level                     │
│  • {{learningType}} - Learning type badge text               │
│  • {{skillFocus}} - Skill focus badge text                   │
│  • {{COVER_TITLE_INSTRUCTION}} - Standard title instruction  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Risk Mitigation

1. **Fallback Templates**: Edge functions have hardcoded fallbacks if DB fetch fails
2. **Gradual Migration**: Test with 3 agents before migrating all 17+
3. **Version History**: Easy rollback to previous template versions
4. **Validation**: UI validates that all required placeholders are present
5. **Cache TTL**: 5-minute cache prevents excessive DB queries while allowing updates
