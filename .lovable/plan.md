
# Outstand.so Integration Plan

## Overview
Integrate Outstand.so for automated social media posting from your existing social drawers. The API key will be stored securely as a Supabase secret and accessed via a new edge function.

---

## Step 1: Store API Key Securely

When implementation begins, I'll use the secret management tool to request your Outstand.so API key. It will be stored as:

| Secret Name | Description |
|-------------|-------------|
| `OUTSTAND_API_KEY` | Your Outstand.so API key from Settings → API |

This secret will only be accessible from edge functions, never exposed to the frontend.

---

## Step 2: Create Edge Function

**New file:** `supabase/functions/post-to-outstand/index.ts`

The edge function will:
- Accept POST requests with platform, content, and optional media
- Authenticate the user via JWT
- Call the Outstand.so API to create/schedule posts
- Return success/error status

```text
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│  Social Drawer  │──────▶│  post-to-outstand    │──────▶│  Outstand.so    │
│  (Frontend)     │       │  (Edge Function)     │       │  API            │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
        │                          │
        │                          │ Uses OUTSTAND_API_KEY
        │                          │ from Supabase secrets
        └──────────────────────────┘
```

**Key features:**
- Uses the existing `createHandler` factory for consistent auth/CORS handling
- Supports all platforms: Instagram, Facebook, TikTok, LinkedIn
- Optional scheduling for future posts
- Returns Outstand post ID for tracking

---

## Step 3: Modify Social Drawers

Update the existing drawers to add a "Post via Outstand" button alongside the manual "I've Posted" button.

**Files to modify:**
- `src/components/books/InstagramPostDrawer.tsx`
- `src/components/books/TikTokPostDrawer.tsx`
- `src/components/books/LinkedInPostDrawer.tsx`
- `src/components/books/social-drawers/SocialDrawerLayout.tsx` (add secondary action support)

**UI Changes:**
- Add "Post with Outstand" button (primary action)
- Keep existing "I've Posted Manually" button (secondary)
- Show loading state during Outstand API call
- Auto-mark as posted on successful Outstand submission

---

## Step 4: Track Outstand Posts (Optional Enhancement)

Add a new column to track which posts were made via Outstand:

| Column | Type | Purpose |
|--------|------|---------|
| `outstand_post_id` | `text` | Store Outstand's returned post ID |
| `posted_via` | `text` | Track method: 'manual' or 'outstand' |

This enables future features like checking post status or viewing analytics.

---

## Technical Details

### Edge Function Structure

```typescript
// supabase/functions/post-to-outstand/index.ts
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

interface OutstandRequest {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin';
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}

Deno.serve(createHandler({
  name: 'post-to-outstand',
  clientMode: 'user',
  requireAuth: true,
}, async ({ req, user }) => {
  const OUTSTAND_API_KEY = Deno.env.get('OUTSTAND_API_KEY');
  if (!OUTSTAND_API_KEY) {
    return errorResponse('Outstand API key not configured', 500);
  }

  const body = await parseBody<OutstandRequest>(req);
  
  // Call Outstand.so API
  const response = await fetch('https://api.outstand.so/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OUTSTAND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform: body.platform,
      content: body.content,
      media: body.mediaUrls,
      scheduled_at: body.scheduledAt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return errorResponse(`Outstand API error: ${error}`, response.status);
  }

  const result = await response.json();
  return successResponse({ postId: result.id, status: 'scheduled' });
}));
```

### Drawer Integration Example

```typescript
// In InstagramPostDrawer.tsx
const handlePostWithOutstand = async () => {
  setIsPosting(true);
  try {
    const { error } = await supabase.functions.invoke('post-to-outstand', {
      body: {
        platform: 'instagram',
        content: fullPost,
        // mediaUrls: [coverImageUrl], // If available
      },
    });
    
    if (error) throw error;
    
    toast({ title: 'Posted to Instagram via Outstand!' });
    markAsPosted('instagram');
    onOpenChange(false);
  } catch (err) {
    toast({ title: 'Failed to post', variant: 'destructive' });
  } finally {
    setIsPosting(false);
  }
};
```

---

## Implementation Order

1. **Add Secret** - Store OUTSTAND_API_KEY securely
2. **Create Edge Function** - Build `post-to-outstand` with Outstand.so API integration
3. **Update SocialDrawerLayout** - Add support for secondary action button
4. **Update Instagram/Facebook Drawer** - Add Outstand posting option
5. **Update TikTok Drawer** - Add Outstand posting option
6. **Update LinkedIn Drawer** - Add Outstand posting option
7. **Test End-to-End** - Verify posting works for each platform

---

## Questions to Confirm

Before implementation:
1. **Which platforms do you have connected in Outstand.so?** (Instagram, Facebook, TikTok, LinkedIn, or all?)
2. **Do you want immediate posting or scheduled posting?** (I can add a time picker for scheduling)
3. **Should I check Outstand.so API docs for the exact endpoint format?** (The example above is a reasonable guess; I'll verify during implementation)

