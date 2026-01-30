

# Plan: Consolidate CORS Headers Duplication

## Problem Summary

The `corsHeaders` constant is duplicated across **43+ edge functions** instead of using the centralized definition in `supabase/functions/_shared/cors.ts`. This creates:

- **Maintenance burden**: Any CORS header changes require updating 40+ files
- **Inconsistency risk**: Headers could drift if updated in some files but not others
- **Code bloat**: ~150 lines of redundant code across the codebase

## Current State Analysis

| Location | Status |
|----------|--------|
| `_shared/cors.ts` | Canonical source (4 lines) |
| `_shared/types.ts` | Duplicate definition (lines 222-225) |
| 43 edge function `index.ts` files | Inline duplicates |
| 9 edge functions | Already importing from `_shared/cors.ts` |

**Functions already using shared import:**
- `admin-chat`, `consume-screen-time`, `download-book-images`, `expire-pending-habits`
- `generate-page-system-prompts`, `generate-png-variants`, `google-chat`
- `google-create-book`, `purchase-reward`

## Implementation Steps

### Step 1: Remove Duplicate from `_shared/types.ts`
Delete the `corsHeaders` definition (lines 218-225) from `types.ts` since it's already properly defined in `cors.ts`. This file should focus on type definitions and validation utilities, not CORS.

### Step 2: Update Edge Functions to Use Shared Import

Replace inline `corsHeaders` definitions with the shared import in all 43 remaining edge functions.

**Before:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**After:**
```typescript
import { corsHeaders } from '../_shared/cors.ts';
```

### Step 3: Batch Update List

The following edge functions need to be updated (grouped for parallel editing):

**Batch 1 - High traffic functions:**
- `generate-color-image/index.ts`
- `generate-thumbnail/index.ts`
- `generate-book-type-image/index.ts`
- `generate-og-image/index.ts`
- `generate-text-image/index.ts`

**Batch 2 - Book creation/management:**
- `agent-creator/index.ts`
- `apply-book-categorization/index.ts`
- `categorize-existing-books/index.ts`
- `generate-blog-post-for-book/index.ts`
- `generate-book-qr-metadata/index.ts`
- `generate-book-slug-qr/index.ts`

**Batch 3 - Daily publishing:**
- `simple-daily-publisher/index.ts`
- `generate-daily-blog-post/index.ts`
- `get-daily-published-images/index.ts`
- `get-landing-page-data/index.ts`

**Batch 4 - User/subscription functions:**
- `check-subscription/index.ts`
- `create-checkout/index.ts`
- `customer-portal/index.ts`
- `delete-account/index.ts`
- `stripe-webhook/index.ts`
- `update-subscription-renewal/index.ts`

**Batch 5 - Utility functions:**
- `admin-upload-image/index.ts`
- `analyze-bites/index.ts`
- `backfill-syllables/index.ts`
- `create-product-description/index.ts`
- `create-scheduled-habits/index.ts`
- `elevenlabs-tts/index.ts`

**Batch 6 - Word/content functions:**
- `generate-word-book-recommendations/index.ts`
- `get-word-syllables/index.ts`
- `regenerate-word-metadata/index.ts`
- `generate-seo-metadata/index.ts`

**Batch 7 - Coloring/image functions:**
- `edit-color-image/index.ts`
- `generate-coloring-image/index.ts`
- `generate-printable-coloring-image/index.ts`

**Batch 8 - External integrations:**
- `google-places-autocomplete/index.ts`
- `reddit-search/index.ts`
- `resort-places-autocomplete/index.ts`
- `youtube-video/index.ts`

**Batch 9 - Remaining functions:**
- `qa-theme-agent/index.ts`
- `rollback-categorization/index.ts`
- `seed-initial-habits/index.ts`
- `standardize-agents/index.ts`
- `what_changed_in_agent/index.ts`

## Technical Details

### Edit Pattern for Each File

For each edge function, the change is straightforward:

1. **Add import** at top of file (after other imports):
   ```typescript
   import { corsHeaders } from '../_shared/cors.ts';
   ```

2. **Remove inline definition** (typically 3-4 lines near top):
   ```typescript
   // DELETE THIS:
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

### No Other Code Changes Required

All edge functions already use `corsHeaders` consistently in their response handling, so no other modifications are needed. The variable name and usage pattern remains identical.

## Files to Modify

| File | Change Type |
|------|-------------|
| `supabase/functions/_shared/types.ts` | Remove duplicate `corsHeaders` (lines 218-225) |
| 43 edge function `index.ts` files | Replace inline definition with import |

## Benefits

1. **Single source of truth** - One place to update CORS configuration
2. **Reduced code** - ~150 lines of duplicate code removed
3. **Consistency guaranteed** - All functions use identical headers
4. **Easier maintenance** - Future CORS changes require editing one file
5. **Better discoverability** - New developers find the pattern immediately

## Risk Assessment

**Risk Level: Very Low**

- No functional changes - only import refactoring
- All edge functions already work with the same `corsHeaders` object structure
- The shared file `_shared/cors.ts` already exists and is battle-tested
- 9 functions already use this pattern successfully

## Estimated Impact

- **Code reduction**: ~150 lines removed
- **Files touched**: 44 files (1 shared, 43 edge functions)
- **Testing required**: Basic smoke test of a few edge functions to verify imports work
- **Implementation time**: Fast - purely mechanical refactoring

