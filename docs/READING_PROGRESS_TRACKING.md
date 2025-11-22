# Reading Progress Tracking System

## Overview

The reading progress tracking system monitors user engagement with books across the Daily ABC Illustrations platform. It provides analytics for administrators and tracks individual reading sessions for users and their kids.

## Architecture

### Database Schema

**Table: `user_book_activity`**
```sql
CREATE TABLE user_book_activity (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID,
  kid_id UUID,
  pages_read INTEGER,
  reading_completed BOOLEAN,
  last_reading_session_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CRITICAL: Unique constraint on (user_id, book_id) where book_id is not null
  CONSTRAINT unique_user_book_activity UNIQUE (user_id, book_id) WHERE (book_id IS NOT NULL)
);
```

**Important Design Decisions:**

1. **One Record Per User-Book Pair**: The unique constraint ensures each user has only ONE activity record per book, regardless of which kid profile is reading.

2. **Kid ID Tracking**: The `kid_id` field stores the MOST RECENT kid who read the book. It does NOT create separate records per kid.

3. **Pages Read Logic**: Uses `GREATEST()` function to ensure the count never decreases - we track the maximum page reached.

4. **Real-Time Enabled**: Table has `REPLICA IDENTITY FULL` set to enable real-time subscriptions for the analytics dashboard.

### Database Function: `update_reading_progress`

**Purpose**: Atomically update or create reading progress records.

**Critical Implementation Detail:**
```sql
ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
DO UPDATE SET ...
```

⚠️ **WARNING**: The `ON CONFLICT` clause MUST exactly match the table's unique constraint. Using a different clause (e.g., including `kid_id` or `COALESCE`) will cause the function to fail silently.

**Function Behavior:**
- **INSERT**: Creates new record if user hasn't read this book
- **UPDATE**: Updates existing record on conflict
  - Increments `view_count`
  - Updates `pages_read` to maximum value seen
  - Sets `reading_completed` to true once reached
  - Updates `last_reading_session_at` timestamp
  - Updates `kid_id` to most recent reader

### Frontend Integration

**Hook: `useReadingProgressTracking`**
- Location: `src/hooks/useReadingProgressTracking.ts`
- Called from: `UnifiedReadingView` component
- Triggers: On page navigation (next/previous)

**Usage Example:**
```typescript
const { updateProgress } = useReadingProgressTracking();

// Called when user navigates to a new page
await updateProgress(
  bookId,           // UUID of current book
  currentPage,      // Page number user reached (1-indexed)
  totalPages,       // Total pages in book
  selectedKid?.id   // Optional: kid profile reading
);
```

### Real-Time Analytics

**Hook: `useUserActivityAnalytics`**
- Location: `src/hooks/useUserActivityAnalytics.ts`
- Subscribes to real-time changes on `user_book_activity`
- Invalidates React Query cache on updates
- Powers the Admin User Activity dashboard

**Real-Time Setup:**
```sql
-- Enable real-time
ALTER TABLE user_book_activity REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE user_book_activity;
```

## Common Issues & Solutions

### Issue 1: Pages Read Shows "0/X"

**Symptom**: Analytics dashboard shows 0 pages read despite users reading books.

**Root Cause**: `ON CONFLICT` clause in `update_reading_progress` function doesn't match the actual unique constraint.

**Solution**: Ensure the function uses:
```sql
ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
```

### Issue 2: Multiple Records Per User-Book

**Symptom**: Database shows multiple `user_book_activity` records for same user and book.

**Root Cause**: Unique constraint was removed or modified.

**Solution**: Verify constraint exists:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_book_activity'::regclass 
AND contype = 'u';
```

### Issue 3: Real-Time Updates Not Working

**Symptom**: Admin dashboard doesn't update when users read.

**Root Cause**: Real-time not enabled for table.

**Solution**: Check and enable real-time:
```sql
-- Check replica identity
SELECT relreplident FROM pg_class WHERE relname = 'user_book_activity';
-- Should return 'f' for FULL

-- Check publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_book_activity';
```

## Testing Checklist

When modifying this system, verify:

- [ ] Pages read count increments correctly
- [ ] Count never decreases (uses GREATEST logic)
- [ ] Reading completed flag sets when reaching last page
- [ ] View count increments on each session
- [ ] Kid ID updates to most recent reader
- [ ] Admin dashboard updates in real-time
- [ ] No duplicate records created per user-book
- [ ] Function doesn't throw errors (check logs)
- [ ] Real-time subscriptions fire on updates

## Related Files

**Frontend:**
- `src/hooks/useReadingProgressTracking.ts` - Progress tracking hook
- `src/hooks/useUserActivityAnalytics.ts` - Real-time analytics hooks
- `src/components/reading/UnifiedReadingView.tsx` - Calls updateProgress
- `src/pages/AdminUserActivity.tsx` - Analytics dashboard

**Database:**
- `supabase/migrations/*_user_book_activity.sql` - Table creation
- `supabase/migrations/*_update_reading_progress.sql` - Function implementation
- `supabase/migrations/*_enable_realtime.sql` - Real-time setup

## Migration History

**2025-01-22**: Fixed ON CONFLICT clause in update_reading_progress
- Changed from: `ON CONFLICT (user_id, book_id, COALESCE(kid_id, ...))`
- Changed to: `ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL`
- Reason: Match actual table constraint to prevent silent failures

**2025-01-22**: Enabled real-time for user_book_activity
- Set REPLICA IDENTITY FULL
- Added table to supabase_realtime publication
- Enables instant analytics updates
