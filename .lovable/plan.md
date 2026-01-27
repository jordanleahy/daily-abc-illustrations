
# PDF Caching and Storage Implementation Plan

## Summary

Implement a system to store generated PDFs in Supabase Storage so they can be reused on subsequent downloads, eliminating redundant PDF generation. The system will support both **full-color book PDFs** and **coloring book PDFs**, with cache invalidation when underlying images change.

---

## Architecture Overview

```text
User clicks "Download book"
    ↓
Check if cached PDF URL exists in books.pdf_url
    ↓
┌─────────────────────────────────────────┐
│  PDF URL exists and is valid?           │
│  ┌─ YES → Download directly from URL    │
│  └─ NO  → Generate PDF                  │
│           ↓                             │
│           Upload to Supabase Storage    │
│           ↓                             │
│           Update books.pdf_url          │
│           ↓                             │
│           Download the new PDF          │
└─────────────────────────────────────────┘
```

---

## Database Changes

### Add Column for Coloring Book PDF URL

The `books` table already has a `pdf_url` column for the main book PDF. We need to add a column for the coloring book PDF:

```sql
ALTER TABLE books ADD COLUMN coloring_pdf_url TEXT;
```

### Add PDF Version Tracking

To detect when images have changed and PDFs need regeneration, add metadata tracking:

```sql
ALTER TABLE books ADD COLUMN pdf_generated_at TIMESTAMPTZ;
ALTER TABLE books ADD COLUMN coloring_pdf_generated_at TIMESTAMPTZ;
```

---

## Storage Configuration

### Create PDF Storage Bucket

Create a new `book-pdfs` bucket for storing generated PDFs:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', true);
```

### RLS Policies for PDF Storage

| Policy | Description |
|--------|-------------|
| Public read | Anyone can download PDFs (they're publicly accessible) |
| Authenticated upload | Only authenticated users can upload PDFs |
| Owner/Admin delete | Users can delete PDFs for their own books |

---

## Implementation Steps

### Step 1: Database Migration

Add the new columns and storage bucket:
- `coloring_pdf_url` column on `books` table
- `pdf_generated_at` and `coloring_pdf_generated_at` timestamps
- `book-pdfs` storage bucket with RLS policies

### Step 2: Create PDF Upload Service

**File:** `src/services/pdfStorageService.ts`

New service to handle PDF storage operations:

```typescript
interface PDFUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

// Upload PDF to storage
async function uploadPDFToStorage(
  blob: Blob,
  bookId: string,
  type: 'book' | 'coloring'
): Promise<PDFUploadResult>

// Update the book record with the new PDF URL
async function updateBookPDFUrl(
  bookId: string,
  pdfUrl: string,
  type: 'book' | 'coloring'
): Promise<void>

// Check if cached PDF is still valid
async function getCachedPDFUrl(
  bookId: string,
  type: 'book' | 'coloring'
): Promise<string | null>
```

### Step 3: Add Cache Invalidation Trigger

Create a database trigger that clears `pdf_url` and `coloring_pdf_url` when page images are updated:

```sql
CREATE OR REPLACE FUNCTION invalidate_book_pdfs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books 
  SET pdf_url = NULL, 
      coloring_pdf_url = NULL,
      pdf_generated_at = NULL,
      coloring_pdf_generated_at = NULL
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_pdfs_on_image_change
AFTER INSERT OR UPDATE ON page_image_urls
FOR EACH ROW
EXECUTE FUNCTION invalidate_book_pdfs();
```

### Step 4: Update PDF Generator Functions

**File:** `src/services/pdfGenerator.ts`

Modify `generateBookPDF` and `generateColoringBookPDF` to:

1. First check for cached PDF URL
2. If cached and valid, download directly
3. If not cached, generate the PDF
4. Upload the generated PDF to storage
5. Update the book record with the new URL
6. Trigger the download

```typescript
export async function generateBookPDF(
  bookId: string, 
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  // 1. Check for cached PDF
  const cachedUrl = await getCachedPDFUrl(bookId, 'book');
  if (cachedUrl) {
    // Download directly from cache
    await downloadFromUrl(cachedUrl, `${bookName}.pdf`);
    return;
  }

  // 2. Generate PDF (existing logic)
  const pages = await fetchBookPageImages(bookId, true);
  const pdfBytes = await generatePDF(pages, options);
  
  // 3. Upload to storage
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const result = await uploadPDFToStorage(blob, bookId, 'book');
  
  // 4. Update book record
  if (result.success && result.publicUrl) {
    await updateBookPDFUrl(bookId, result.publicUrl, 'book');
  }
  
  // 5. Download
  await downloadBlob(blob, `${bookName}.pdf`);
}
```

---

## Cache Invalidation Strategy

PDFs will be automatically invalidated when:

| Event | Action |
|-------|--------|
| New image uploaded to a page | Trigger clears `pdf_url` and `coloring_pdf_url` |
| Image URL updated | Trigger clears cached URLs |
| User regenerates an image | Trigger clears cached URLs |

This ensures users always get the latest version of the book while still benefiting from caching when content hasn't changed.

---

## File Changes Summary

| File | Changes |
|------|---------|
| **Database Migration** | Add `coloring_pdf_url`, `pdf_generated_at`, `coloring_pdf_generated_at` columns; create `book-pdfs` bucket; add invalidation trigger |
| `src/services/pdfStorageService.ts` | **New file** - PDF upload, URL management, and cache checking |
| `src/services/pdfGenerator.ts` | Add cache-first logic to `generateBookPDF` and `generateColoringBookPDF` |

---

## Security Considerations

- PDFs are stored in a public bucket for easy download access
- Upload is restricted to authenticated users only
- Storage path includes `bookId` to organize files
- RLS on `books` table already restricts who can update `pdf_url`
- Only book owners and admins can trigger PDF regeneration

---

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Cached URL exists but file deleted | Check if URL is valid before returning, regenerate if 404 |
| Upload fails | Still download the generated PDF locally, log error |
| User downloads during generation | Loading state prevents double-clicks |
| Book has no images | Error toast before attempting generation |
| Storage quota exceeded | Fallback to local download only |
