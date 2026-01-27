

# Download Coloring Book Button Implementation Plan

## Summary

Add a "Download Coloring Book" button below the existing "Download book" button in the `UserLibraryDetail` page. This button will generate and download a PDF using the **printable coloring images** (`printable_coloring_image_url`) - the black & white line art with a small color reference thumbnail in the corner.

---

## Technical Implementation

### Step 1: Add Fetch Function for Printable Coloring Images

**File:** `src/services/pdfGenerator.ts`

Add a new function to fetch the printable coloring images (similar to the existing `fetchBookColoringImages` but targeting the `printable_coloring_image_url` field):

```typescript
export async function fetchBookPrintableColoringImages(bookId: string): Promise<PageImageData[]> {
  // Query pages table
  // For each page, fetch printable_coloring_image_url from page_image_urls
  // Return only pages that have printable coloring images
}
```

### Step 2: Add PDF Generator Function for Coloring Book

**File:** `src/services/pdfGenerator.ts`

Add a new function to generate and download the coloring book PDF:

```typescript
export async function generateColoringBookPDF(
  bookId: string,
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  // Fetch printable coloring images
  // Use existing generatePDF() function
  // Download with filename: "{BookName}-Coloring-Book.pdf"
}
```

### Step 3: Update UserLibraryDetail Page

**File:** `src/pages/UserLibraryDetail.tsx`

Changes:
1. Add new state variable: `isDownloadingColoring`
2. Add new handler function: `handleDownloadColoringPDF`
3. Add new button below the existing "Download book" button

Button specifications:
- Text: "Download Coloring Book"
- Shows loading state: "Generating..." with spinner
- Uses the same styling pattern as the existing download button

---

## UI Layout

The buttons will be stacked vertically in the header action area:

```text
+---------------------------+
| [Calendar] [Habit] [Download book]        |
|               [Download Coloring Book]    |
+---------------------------+
```

---

## Data Flow

```text
User clicks "Download Coloring Book"
    ↓
fetchBookPrintableColoringImages(bookId)
    ↓
Query page_image_urls for printable_coloring_image_url
    ↓
generatePDF() with the printable images
    ↓
Browser downloads: "{BookName}-Coloring-Book.pdf"
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/pdfGenerator.ts` | Add `fetchBookPrintableColoringImages()` and `generateColoringBookPDF()` functions |
| `src/pages/UserLibraryDetail.tsx` | Add state, handler, and button for coloring book download |

---

## Edge Cases Handled

- If no printable coloring images exist, shows error toast
- Loading state prevents double-clicks
- Failed image downloads are logged but don't break the PDF generation
- WebP images are converted to PNG/JPG for PDF compatibility

