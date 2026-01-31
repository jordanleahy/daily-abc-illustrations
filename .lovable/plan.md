

# Etsy Publication Filter - Implementation Plan

## Overview
Add a filter button to the My Books page that opens a bottom sheet allowing you to filter books that have **not** been published to Etsy. This helps identify books that still need to be listed on Etsy.

---

## What You'll See

The existing "Themes" filter button will be joined by a new **"Etsy Filter"** button. When tapped, it opens a bottom sheet with toggle options:
- **Show only books NOT on Etsy** - Filters to books that haven't been marked as listed on Etsy yet

The button will show a badge indicator when the filter is active, similar to how the Themes button works.

---

## Implementation Steps

### 1. Update BookFilterBar Component
Add a new filter section for Etsy status:
- New prop: `etsyFilter` (boolean) - whether to show only non-Etsy books
- New prop: `onEtsyFilterChange` - callback when filter changes
- New button: "Etsy" with filter icon, opens bottom sheet on mobile, popover on desktop
- Simple checkbox: "Show only books NOT listed on Etsy"

### 2. Update useBooks Hook
Modify the database query to support Etsy filtering:
- Add new parameter: `etsyFilter?: boolean`
- When enabled, perform a LEFT JOIN with `book_social_posts` where `platform = 'etsy'`
- Filter to books where the join result is NULL (meaning no Etsy post exists)

The SQL logic:
```text
LEFT JOIN book_social_posts ON books.id = book_social_posts.book_id 
  AND book_social_posts.platform = 'etsy'
WHERE book_social_posts.id IS NULL  -- No Etsy post exists
```

### 3. Update Books.tsx Page
- Add new state: `etsyFilter` (boolean, default false)
- Pass filter state to `BookFilterBar`
- Pass filter to `useBooks` hook
- Reset pagination when filter changes

---

## Technical Details

### Modified Files

| File | Changes |
|------|---------|
| `src/components/filters/BookFilterBar.tsx` | Add Etsy filter props, button, and sheet/popover content |
| `src/hooks/useBooks.ts` | Add `etsyFilter` parameter, modify query with LEFT JOIN |
| `src/pages/Books.tsx` | Add state management and pass filter to components |

### Database Query Update
The `useBooks` hook will need to conditionally add the `book_social_posts` table to the select query when the Etsy filter is active, using Supabase's ability to filter on joined tables.

### UI/UX Considerations
- Filter button appears next to existing Themes button
- Badge shows when filter is active (similar to theme count badge)
- Clear all filters button will also clear Etsy filter
- Admin-only feature (since Etsy publishing is admin-only)

---

## Estimated Scope
- **Files Modified**: 3
- **New Components**: 0 (extends existing BookFilterBar)
- **Database Changes**: None (uses existing `book_social_posts` table)

