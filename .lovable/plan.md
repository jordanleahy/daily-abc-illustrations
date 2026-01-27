
# Download Stickers PDF - 4×6 Avery Label Format

## Summary

Add a new "Download Stickers" button to `UserBookCard.tsx` that generates a PDF formatted for 4×6 Avery shipping labels. Each page of the book becomes a sticker using the `text_image_url` (full-color with text overlay), optimized to maximize height on the 4×6 format.

---

## 4×6 Label Specifications

| Property | Value |
|----------|-------|
| **Label Size** | 4" × 6" (288 × 432 points at 72 DPI) |
| **Orientation** | Portrait (taller than wide) |
| **Image Fit** | Maximize height, center horizontally |
| **Use Case** | Print → Stick on items, boxes, gifts |

---

## Implementation Overview

```text
┌─────────────────────────────────────────┐
│           New Function                   │
│  generateStickersPDF(bookId, bookName)  │
│                                         │
│  1. Fetch text_image_url for all pages  │
│  2. Create PDF with 4×6 page size       │
│  3. Scale each image to fit 4×6         │
│  4. Center image on label               │
│  5. Download as PDF                     │
└─────────────────────────────────────────┘
```

---

## File Changes

### 1. `src/services/pdfGenerator.ts` - Add Sticker PDF Function

Add a new function `generateStickersPDF` that:
- Creates PDF pages sized exactly 4×6 inches (288×432 points)
- Uses `text_image_url` (color images with text overlay)
- Scales each image to maximize height while fitting within the 4×6 bounds
- Centers the image horizontally if it doesn't fill the full width
- Downloads with filename `{BookName}-Stickers.pdf`

**Key calculations:**
```typescript
// 4×6 inches at 72 DPI = 288×432 points
const LABEL_WIDTH = 288;   // 4 inches
const LABEL_HEIGHT = 432;  // 6 inches

// Scale to fit, maximizing height
const scaleToFitHeight = LABEL_HEIGHT / image.height;
const scaleToFitWidth = LABEL_WIDTH / image.width;
const scale = Math.min(scaleToFitHeight, scaleToFitWidth);

const scaledWidth = image.width * scale;
const scaledHeight = image.height * scale;

// Center horizontally, align to top or center vertically
const x = (LABEL_WIDTH - scaledWidth) / 2;
const y = (LABEL_HEIGHT - scaledHeight) / 2;
```

### 2. `src/components/books/UserBookCard.tsx` - Add Button

Add a new state variable and button below the existing download buttons:

```typescript
// New state
const [isDownloadingStickers, setIsDownloadingStickers] = useState(false);

// New button (after "Download Color Book PDF")
<Button onClick={...}>
  <Sticker className="h-4 w-4" /> {/* or Download icon */}
  Download Stickers
</Button>
```

---

## Technical Details

### New Function: `generateStickersPDF`

Location: `src/services/pdfGenerator.ts`

```typescript
/**
 * Generates a PDF formatted for 4×6 Avery shipping labels
 * Each page is one sticker using text_image_url (color with text)
 */
export async function generateStickersPDF(
  bookId: string, 
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  const sanitizedName = bookName.replace(/[^a-zA-Z0-9\s-]/g, '');
  const filename = `${sanitizedName}-Stickers.pdf`;

  // 4×6 inches at 72 DPI
  const LABEL_WIDTH = 288;
  const LABEL_HEIGHT = 432;

  try {
    // Fetch text_image_url for all pages (useTextImages: true)
    const pages = await fetchBookPageImages(bookId, true);
    const pagesWithImages = pages.filter(p => p.image_url);
    
    if (pagesWithImages.length === 0) {
      throw new Error('No images found for stickers');
    }

    const pdfDoc = await PDFDocument.create();

    for (const page of pagesWithImages) {
      // Download and embed image
      let imageBuffer = await downloadImage(page.image_url);
      let format = detectImageFormat(imageBuffer);
      
      // Convert WebP if needed
      if (format === 'webp') {
        imageBuffer = await convertWebPToPNG(imageBuffer);
        format = 'png';
      }

      const image = format === 'png' 
        ? await pdfDoc.embedPng(imageBuffer)
        : await pdfDoc.embedJpg(imageBuffer);

      // Calculate scaling to fit 4×6 while maximizing size
      const scaleToFitHeight = LABEL_HEIGHT / image.height;
      const scaleToFitWidth = LABEL_WIDTH / image.width;
      const scale = Math.min(scaleToFitHeight, scaleToFitWidth);

      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      // Center on the label
      const x = (LABEL_WIDTH - scaledWidth) / 2;
      const y = (LABEL_HEIGHT - scaledHeight) / 2;

      // Create 4×6 page and draw image
      const pdfPage = pdfDoc.addPage([LABEL_WIDTH, LABEL_HEIGHT]);
      pdfPage.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    downloadBlob(blob, filename);
    
  } catch (error) {
    console.error('[PDF] Error during sticker PDF generation:', error);
    throw error;
  }
}
```

### Button in `UserBookCard.tsx`

```typescript
{/* Download Stickers PDF - 4×6 Avery label format */}
{publicationStatus && (
  <Button 
    variant="outline"
    size="sm"
    className="w-full gap-2"
    disabled={isDownloadingStickers}
    onClick={async (e) => {
      e.stopPropagation();
      setIsDownloadingStickers(true);
      try {
        await generateStickersPDF(book.id, book.book_name);
        toast({ title: 'Stickers PDF downloaded successfully' });
      } catch (error) {
        console.error('Failed to generate stickers PDF:', error);
        toast({ 
          title: 'Failed to generate stickers PDF',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive'
        });
      } finally {
        setIsDownloadingStickers(false);
      }
    }}
  >
    {isDownloadingStickers ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Download className="h-4 w-4" />
    )}
    {isDownloadingStickers ? 'Generating...' : 'Download Stickers'}
  </Button>
)}
```

---

## Print Instructions for Users

When printed via File > Print:
- Select "Actual Size" (not "Fit to Page")
- Paper size: 4×6 or match your label stock
- Each PDF page = one 4×6 sticker
- Works with both sheet labels and thermal label printers

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/services/pdfGenerator.ts` | Add `generateStickersPDF()` function |
| `src/components/books/UserBookCard.tsx` | Add state + button for stickers download |

**No new dependencies required** - uses existing `pdf-lib` library.
