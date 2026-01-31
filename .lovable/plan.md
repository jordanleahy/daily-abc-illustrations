

## Root Cause Analysis: Corrupted Color Reference Thumbnails

### Problem Description
Color reference thumbnails in printable coloring pages appear washed-out and corrupted (as shown in the screenshot). This affects recently generated coloring books where the color source image is served as JPEG.

### Root Cause Identified
**Bug Location:** `supabase/functions/generate-printable-coloring-image/index.ts`, lines 52-59

**The Issue:** The JPEG decoder library (`jpegts@1.1`) returns **RGBA data (4 bytes per pixel)**, but the code incorrectly assumes it returns **RGB data (3 bytes per pixel)**.

**Current Broken Code:**
```typescript
const decoded = decodeJpeg(bytes);
// Convert RGB to RGBA - WRONG ASSUMPTION!
const rgba = new Uint8Array(decoded.width * decoded.height * 4);
for (let i = 0; i < decoded.width * decoded.height; i++) {
  rgba[i * 4] = decoded.data[i * 3];       // Reads wrong byte!
  rgba[i * 4 + 1] = decoded.data[i * 3 + 1];
  rgba[i * 4 + 2] = decoded.data[i * 3 + 2];
  rgba[i * 4 + 3] = 255;
}
```

**What Happens:**
- Pixel 0: Reads bytes 0,1,2 (R,G,B) - correct
- Pixel 1: Reads bytes 3,4,5 (A,R,G) - WRONG! (skips over alpha, reads shifted channels)
- Pixel 2: Reads bytes 6,7,8 - even more misaligned
- Result: Colors become increasingly corrupted across the image

### Why It Started Happening Recently
The problem manifests when:
1. Color images are uploaded as WebP files
2. Supabase Storage serves them with automatic format conversion
3. The edge function detects the served format as JPEG (not WebP)
4. The broken JPEG→RGBA conversion corrupts the pixel data

---

## Technical Fix

### Step 1: Fix JPEG Decoding
Since `jpegts` already returns RGBA data, simply use it directly:

```typescript
} else if (isJpeg) {
  console.log(`  📄 Detected JPEG format`);
  const decoded = decodeJpeg(bytes);
  // jpegts already returns RGBA - use directly!
  return {
    data: new Uint8Array(decoded.data),
    width: decoded.width,
    height: decoded.height,
  };
}
```

### Step 2: Add WebP Detection (Improvement)
Add proper WebP format detection with a clear error message:

```typescript
const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 
            && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
```

### Step 3: Regenerate Affected Images
After deploying the fix, trigger batch regeneration for books with corrupted printable coloring images.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-printable-coloring-image/index.ts` | Fix JPEG decoding to use RGBA data directly instead of incorrect RGB conversion |

---

## Verification Steps

1. Deploy the fixed edge function
2. Manually trigger printable image generation for a test book
3. Verify the color thumbnail appears vibrant and correctly colored
4. Run batch regeneration for affected books from the past week

