
# Add Coloring Book PDF Download Button

## Summary

Add a new "Download Color Book PDF" button below the existing "Download PDF" button in `UserBookCard.tsx`. This button will download the printable coloring book version (black-and-white line art with a small color reference thumbnail in the top-left corner).

---

## Current Buttons

| Button | Function | Image Type |
|--------|----------|------------|
| "Download PDF" | `generateBookPDF` with `useTextImages: true` | Full-color images with text overlay |
| **NEW** "Download Color Book PDF" | `generateColoringBookPDF` | B&W line art + color thumbnail |

---

## Implementation

### File: `src/components/books/UserBookCard.tsx`

**1. Update import (line 29)**

Add `generateColoringBookPDF` to the existing import:

```typescript
import { generateBookPDF, generateColoringBookPDF } from '@/services/pdfGenerator';
```

**2. Add new state variable (around line 77)**

Add a loading state for the new button:

```typescript
const [isDownloadingColoringPdf, setIsDownloadingColoringPdf] = useState(false);
```

**3. Add new button (after line 566)**

Insert a new button immediately after the existing "Download PDF" button:

```typescript
{/* Download Coloring Book PDF - Printable version with color thumbnail */}
{publicationStatus && (
  <Button 
    variant="outline"
    size="sm"
    className="w-full gap-2"
    disabled={isDownloadingColoringPdf}
    onClick={async (e) => {
      e.stopPropagation();
      setIsDownloadingColoringPdf(true);
      try {
        await generateColoringBookPDF(book.id, book.book_name);
        toast({ title: 'Coloring book PDF downloaded successfully' });
      } catch (error) {
        console.error('Failed to generate coloring book PDF:', error);
        toast({ 
          title: 'Failed to generate coloring book PDF',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive'
        });
      } finally {
        setIsDownloadingColoringPdf(false);
      }
    }}
  >
    {isDownloadingColoringPdf ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Download className="h-4 w-4" />
    )}
    {isDownloadingColoringPdf ? 'Generating...' : 'Download Color Book PDF'}
  </Button>
)}
```

---

## Consolidated Code Verification

The new button will use `generateColoringBookPDF` from `src/services/pdfGenerator.ts`, which:
- Checks for cached PDF first (via `getCachedPDFUrl`)
- Fetches `printable_coloring_image_url` images (B&W with color thumbnail)
- Uses the consolidated `downloadBlob` utility from `pdfStorageService.ts`
- Caches the generated PDF for future downloads

This follows the same pattern already used in `UserLibraryDetail.tsx`.

---

## Visual Result

After implementation, the card will show:
1. **Download PDF** - Full-color book
2. **Download Color Book PDF** - Printable coloring pages with color reference

Both buttons appear only for published books (when `publicationStatus` exists).
