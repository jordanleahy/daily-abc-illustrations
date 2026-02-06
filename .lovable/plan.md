

# Ordered Image Gallery for Social Media Drawers

## Overview
Add a selectable image gallery to all social media bottom sheets. Images display as thumbnails organized by type, and each selection is **numbered in order** (1, 2, 3...) so the images are posted in exactly the sequence you chose. Maximum of 20 selections.

## What You'll See

When you open any social drawer (Instagram, Facebook, TikTok, LinkedIn, YouTube, Etsy), below the existing text sections:

- A new **"Select Images (0/20)"** section with thumbnails grouped by type
- **Cover/Educational** -- the full-color illustrations
- **Content** -- pages with text overlay (the letter pages)
- **Coloring** -- the printable coloring pages with the color reference thumbnail in the corner
- Tapping a thumbnail selects it and shows a **numbered blue badge** (1, 2, 3...) indicating post order
- Tapping again deselects it and **renumbers** all remaining selections to stay contiguous
- A "Clear all" button resets the selection
- When you post via Outstand, images are sent in your chosen order

## Technical Details

### 1. New Component: `SocialImageGallery`

**File:** `src/components/books/social-drawers/SocialImageGallery.tsx`

**Data fetching:** Uses `useQuery` to fetch from `page_image_urls` joined with `pages`:

```text
page_image_urls (is_latest=true, book_id=bookId)
  -> joined with pages (page_type, page_number)
```

**Image extraction per page row:**
| Category Label | Source Column | Condition |
|---|---|---|
| Cover | `image_url` | `page_type = 'cover'` |
| Educational | `image_url` | `page_type = 'educational'` |
| Content (A, B...) | `text_image_url` | `page_type = 'content'` and URL exists |
| Coloring (A, B...) | `printable_coloring_image_url` | URL exists on any page |

**Ordered selection state:** The selection is stored as an **ordered array** of URLs (`string[]`), not a Set. This preserves insertion order.

- **On select:** Append the URL to the end of the array (if under max 20)
- **On deselect:** Remove the URL from the array; remaining items keep their relative order and badges renumber automatically
- The badge number is derived from `selectedUrls.indexOf(url) + 1`

**Props:**
```text
bookId: string
selectedUrls: string[]              -- ordered array of selected image URLs
onSelectionChange: (urls: string[]) => void
maxSelection?: number               -- defaults to 20
```

**UI layout:**
- 3-column grid on mobile, 4-column on desktop
- Each thumbnail is an `AspectRatio` (1:1) with the image inside
- Selected thumbnails get a `ring-2 ring-primary` border and a numbered badge in the top-right corner
- Section headers for each image type group
- Counter text: "3/20 selected" with a "Clear" button

### 2. Update `SocialDrawerLayout`

**File:** `src/components/books/social-drawers/SocialDrawerLayout.tsx`

Add optional props to enable the gallery:
- `bookId?: string`
- `selectedMediaUrls?: string[]`
- `onMediaSelectionChange?: (urls: string[]) => void`
- `maxMediaSelection?: number` (default 20)

When `bookId` is provided, render `SocialImageGallery` between `{children}` and the footer, inside the existing scrollable area. This means every drawer that passes `bookId` automatically gets the gallery.

### 3. Update All Social Drawers

Each drawer gets:
1. A `useState<string[]>([])` for `selectedMediaUrls`
2. Pass `bookId`, `selectedMediaUrls`, and `onMediaSelectionChange` to `SocialDrawerLayout`
3. Include `mediaUrls: selectedMediaUrls` in the `post-to-outstand` edge function call body (the array is already in the user's chosen order)

**Files to modify:**
- `src/components/books/InstagramPostDrawer.tsx` -- already has `bookId` prop
- `src/components/books/TikTokPostDrawer.tsx` -- already has `bookId` prop
- `src/components/books/LinkedInPostDrawer.tsx` -- uses `book.id`
- `src/components/books/YouTubePostDrawer.tsx` -- uses `book.id`
- `src/components/books/EtsyPostDrawer.tsx` -- uses its own layout, so the gallery is embedded directly in its JSX (same component, just rendered inline)

### 4. No Edge Function Changes

The `post-to-outstand` edge function already accepts `mediaUrls` as an array and passes it to the Outstand API as `media`. The ordered array from the frontend is forwarded as-is, preserving the user's chosen sequence.

## Implementation Order

1. Create `SocialImageGallery` component with fetch logic, grouped display, and ordered selection
2. Update `SocialDrawerLayout` to accept gallery props and render the gallery
3. Update Instagram/Facebook drawer (single component with `platform` prop)
4. Update TikTok drawer
5. Update LinkedIn drawer
6. Update YouTube drawer
7. Update Etsy drawer (embed gallery directly in its custom layout)

