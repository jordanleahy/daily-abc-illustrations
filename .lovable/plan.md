
## Update Etsy File Name Generation

### Problem
Etsy digital file uploads have strict file name requirements:
- Between 3 and 70 characters
- No spaces allowed
- Only letters, numbers, hyphens, underscores, or periods

Currently, the PDF downloads use file names with spaces (e.g., "Shelly's Winter Feelings-Color.pdf"), which fail Etsy's validation.

### Solution
Add an Etsy-compliant file name generator and display it prominently in the Etsy Listing drawer so users can easily copy it and rename their downloaded PDF before uploading to Etsy.

---

### Technical Details

**File 1: `src/utils/marketing/generateEtsyListing.ts`**

Add a new function `generateEtsyFileName` and include it in the returned listing object:

```typescript
/**
 * Generate Etsy-compliant file name (3-70 chars, no spaces, alphanumeric + hyphens/underscores/periods only)
 */
function generateEtsyFileName(bookName: string, bookType: string | null): string {
  // Start with book name, convert to valid characters
  let fileName = bookName
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  // Add suffix for clarity
  const suffix = '-ColoringBook';
  
  // Ensure total length is 3-70 (accounting for .pdf extension = 4 chars)
  // Max base name = 70 - 4 = 66 chars
  const maxBaseLength = 66 - suffix.length; // 53 chars for name
  
  if (fileName.length > maxBaseLength) {
    fileName = fileName.substring(0, maxBaseLength);
    fileName = fileName.replace(/-$/, ''); // Clean trailing hyphen after truncation
  }
  
  fileName = `${fileName}${suffix}`;
  
  // Ensure minimum 3 chars (before .pdf)
  if (fileName.length < 3) {
    fileName = 'ColoringBook';
  }
  
  return fileName;
}
```

Update the `EtsyListing` interface to include:
```typescript
interface EtsyListing {
  title: string;
  description: string;
  tags: string[];
  fileName: string;  // NEW: Etsy-compliant file name (without .pdf extension)
}
```

**File 2: `src/components/books/EtsyPostDrawer.tsx`**

Add a new "File Name" section at the top of the drawer (before Description):

```typescript
{/* File Name Section - NEW */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-foreground">File Name</label>
    <span className="text-xs text-muted-foreground">{fileName.length + 4}/70 chars</span>
  </div>
  <div className="relative">
    <div className="p-3 pr-12 bg-muted rounded-lg text-sm font-mono break-all">
      {fileName}.pdf
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
      onClick={(e) => handleCopy(e, `${fileName}.pdf`, 'fileName')}
    >
      {fileNameCopied ? <Check /> : <Copy />}
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    Rename your PDF to this before uploading to Etsy
  </p>
</div>
```

Add state for file name copy feedback:
```typescript
const [fileNameCopied, setFileNameCopied] = useState(false);
```

Update the `handleCopy` function to handle the new type:
```typescript
const handleCopy = async (e: React.MouseEvent, text: string, type: 'title' | 'description' | 'fileName') => {
  // ... existing logic
  if (type === 'fileName') {
    setFileNameCopied(true);
    setTimeout(() => setFileNameCopied(false), 2000);
  }
};
```

### Summary of Changes
1. Add `generateEtsyFileName()` function to create compliant file names
2. Return `fileName` in the listing object from `generateEtsyListing()`
3. Add "File Name" section in drawer with copy button
4. Show character count (X/70) and helper text explaining to rename the PDF
