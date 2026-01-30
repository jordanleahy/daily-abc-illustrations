
## Fix CPU Timeout in Printable Coloring Image Generation

### Problem
When clicking "Continue Printable..." or "Create Printable ColorBook", the edge function times out with a "CPU Time exceeded" error. This happens because the function tries to process all 26+ pages in a single invocation, which exceeds Supabase Edge Function limits.

### Solution
Implement chunked batch processing where:
1. The edge function processes only 2-3 pages per invocation
2. The client calls the function repeatedly until all pages are complete
3. Progress is shown to the user during multi-batch processing

---

### Technical Details

**File 1: `supabase/functions/generate-printable-coloring-image/index.ts`**

Add a `maxPages` parameter to limit pages processed per invocation:

```typescript
// In batch processing section (around line 278)
if (batchProcess && bookId) {
  const maxPages = 3; // Process max 3 pages per invocation
  
  // ... existing page fetch logic ...
  
  // Filter to only pages that need processing (no printable image yet)
  const pagesToProcess = pages
    .filter(p => !p.printable_coloring_image_url)
    .slice(0, maxPages); // Limit batch size
  
  // ... process only pagesToProcess ...
  
  // Return remaining count so client knows to continue
  const remainingPages = pages.filter(p => !p.printable_coloring_image_url).length - pagesToProcess.length;
  
  return {
    success: true,
    summary: { success, skipped, errors, remaining: remainingPages },
    hasMore: remainingPages > 0,
    results
  };
}
```

**File 2: `src/components/books/UserBookCard.tsx`**

Update the onClick handler to loop until all batches complete:

```typescript
// Around line 327-357
setIsGeneratingPrintable(true);
try {
  const { data: session } = await supabase.auth.getSession();
  let totalProcessed = 0;
  let hasMore = true;
  
  // Process in batches until complete
  while (hasMore) {
    const response = await fetch(
      `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/generate-printable-coloring-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token || ''}`,
        },
        body: JSON.stringify({ batchProcess: true, bookId: book.id }),
      }
    );
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate');
    }
    
    totalProcessed += result.summary?.success || 0;
    hasMore = result.hasMore === true;
    
    // Brief pause between batches
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  toast({ 
    title: "Printable coloring book created!",
    description: `${totalProcessed} pages generated`
  });
  refetchPrintableStatus();
} catch (error) {
  // ... error handling
}
```

### Changes Summary
1. **Edge Function**: Add `maxPages = 3` limit and return `hasMore` flag when more pages remain
2. **Client**: Loop through batches with a while loop until `hasMore` is false
3. **UX**: Each batch processes 2-3 pages, staying well under the CPU limit
4. **Progress**: User sees the button in "Generating..." state until all batches complete
