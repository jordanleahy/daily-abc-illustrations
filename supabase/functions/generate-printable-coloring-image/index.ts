import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import { decode as decodePng, encode as encodePng } from "https://deno.land/x/pngs@0.1.1/mod.ts";
import { decode as decodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";

const THUMBNAIL_CONFIG = {
  scale: 0.18,
  padding: 20,
  borderWidth: 4,
  borderColor: { r: 51, g: 51, b: 51 },
  shadowOffset: 3,
  shadowBlur: 8,
};

async function fetchImageData(url: string) {
  console.log(`📥 Fetching image: ${url.substring(0, 80)}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  
  const bytes = new Uint8Array(await response.arrayBuffer());
  
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 
              && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  
  if (isPng) {
    const decoded = decodePng(bytes);
    return { data: new Uint8Array(decoded.image), width: decoded.width, height: decoded.height };
  } else if (isJpeg) {
    const decoded = decodeJpeg(bytes);
    return { data: new Uint8Array(decoded.data), width: decoded.width, height: decoded.height };
  } else if (isWebP) {
    throw new Error('WebP format not supported. Please use PNG or JPEG.');
  } else {
    throw new Error('Unsupported image format. Only PNG and JPEG are supported.');
  }
}

function fillRect(buffer: Uint8Array, canvasWidth: number, x: number, y: number, width: number, height: number, r: number, g: number, b: number, a = 255) {
  const x1 = Math.max(0, Math.floor(x));
  const y1 = Math.max(0, Math.floor(y));
  const x2 = Math.min(canvasWidth, Math.floor(x + width));
  const y2 = Math.min(buffer.length / (canvasWidth * 4), Math.floor(y + height));
  
  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const idx = (py * canvasWidth + px) * 4;
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }
}

function drawImageScaled(dest: Uint8Array, destWidth: number, destHeight: number, src: Uint8Array, srcWidth: number, srcHeight: number, destX: number, destY: number, drawWidth: number, drawHeight: number) {
  const scaleX = srcWidth / drawWidth;
  const scaleY = srcHeight / drawHeight;
  
  for (let dy = 0; dy < drawHeight; dy++) {
    const py = destY + dy;
    if (py < 0 || py >= destHeight) continue;
    
    for (let dx = 0; dx < drawWidth; dx++) {
      const px = destX + dx;
      if (px < 0 || px >= destWidth) continue;
      
      const srcX = dx * scaleX;
      const srcY = dy * scaleY;
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const y1 = Math.min(y0 + 1, srcHeight - 1);
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;
      
      const idx00 = (y0 * srcWidth + x0) * 4;
      const idx10 = (y0 * srcWidth + x1) * 4;
      const idx01 = (y1 * srcWidth + x0) * 4;
      const idx11 = (y1 * srcWidth + x1) * 4;
      
      const destIdx = (py * destWidth + px) * 4;
      for (let c = 0; c < 4; c++) {
        const v00 = src[idx00 + c] || 0;
        const v10 = src[idx10 + c] || 0;
        const v01 = src[idx01 + c] || 0;
        const v11 = src[idx11 + c] || 0;
        const top = v00 * (1 - xFrac) + v10 * xFrac;
        const bottom = v01 * (1 - xFrac) + v11 * xFrac;
        dest[destIdx + c] = Math.round(top * (1 - yFrac) + bottom * yFrac);
      }
    }
  }
}

async function compositeImagesCanvas(bwImageUrl: string, colorImageUrl: string): Promise<Uint8Array> {
  console.log(`🎨 Starting canvas compositing...`);
  
  const [bwImage, colorImage] = await Promise.all([fetchImageData(bwImageUrl), fetchImageData(colorImageUrl)]);
  
  console.log(`📐 B&W image: ${bwImage.width}x${bwImage.height}`);
  console.log(`📐 Color image: ${colorImage.width}x${colorImage.height}`);
  
  const outputWidth = bwImage.width;
  const outputHeight = bwImage.height;
  const outputBuffer = new Uint8Array(outputWidth * outputHeight * 4);
  outputBuffer.set(bwImage.data);
  
  const scaleFactor = outputWidth / 1024;
  const thumbnailWidth = Math.round(outputWidth * THUMBNAIL_CONFIG.scale);
  const thumbnailHeight = Math.round((colorImage.height / colorImage.width) * thumbnailWidth);
  const padding = Math.round(THUMBNAIL_CONFIG.padding * scaleFactor);
  const borderWidth = Math.max(2, Math.round(THUMBNAIL_CONFIG.borderWidth * scaleFactor));
  
  const thumbX = padding;
  const thumbY = padding;
  
  fillRect(outputBuffer, outputWidth, thumbX - borderWidth, thumbY - borderWidth, thumbnailWidth + borderWidth * 2, thumbnailHeight + borderWidth * 2, 255, 255, 255);
  fillRect(outputBuffer, outputWidth, thumbX - borderWidth, thumbY - borderWidth, thumbnailWidth + borderWidth * 2, thumbnailHeight + borderWidth * 2, THUMBNAIL_CONFIG.borderColor.r, THUMBNAIL_CONFIG.borderColor.g, THUMBNAIL_CONFIG.borderColor.b);
  fillRect(outputBuffer, outputWidth, thumbX, thumbY, thumbnailWidth, thumbnailHeight, 255, 255, 255);
  drawImageScaled(outputBuffer, outputWidth, outputHeight, colorImage.data, colorImage.width, colorImage.height, thumbX, thumbY, thumbnailWidth, thumbnailHeight);
  
  console.log(`✅ Compositing complete, encoding PNG...`);
  const pngBytes = encodePng(outputBuffer, outputWidth, outputHeight);
  console.log(`📦 Output PNG size: ${(pngBytes.length / 1024).toFixed(1)}KB`);
  
  return pngBytes;
}

interface PrintableRequest {
  pageId?: string;
  bookId?: string;
  batchProcess?: boolean;
}

Deno.serve(createHandler({
  name: 'generate-printable-coloring-image',
  clientMode: 'service',
  requireAuth: false,
}, async ({ supabase, req }) => {
  const { pageId, bookId, batchProcess } = await parseBody<PrintableRequest>(req);

  // Batch processing mode
  if (batchProcess && bookId) {
    const MAX_PAGES_PER_BATCH = 3;
    
    console.log(`📚 Batch processing printable coloring images for book: ${bookId}`);
    
    const { data: pages, error: pagesError } = await supabase
      .from('page_image_urls')
      .select('id, page_id, image_url, coloring_image_url, printable_coloring_image_url')
      .eq('book_id', bookId)
      .eq('is_latest', true)
      .not('image_url', 'is', null)
      .not('coloring_image_url', 'is', null);

    if (pagesError) throw new Error(`Failed to fetch pages: ${pagesError.message}`);

    if (!pages || pages.length === 0) {
      return successResponse({ success: true, message: 'No pages found with both color and coloring images', processed: 0, hasMore: false });
    }

    const pagesToProcess = pages.filter(p => !p.printable_coloring_image_url).slice(0, MAX_PAGES_PER_BATCH);
    const totalRemaining = pages.filter(p => !p.printable_coloring_image_url).length;
    
    console.log(`📄 Found ${pages.length} total pages, ${totalRemaining} need processing, processing ${pagesToProcess.length} this batch`);

    if (pagesToProcess.length === 0) {
      return successResponse({ success: true, message: 'All pages already have printable images', summary: { success: 0, skipped: pages.length, errors: 0, remaining: 0 }, hasMore: false, results: [] });
    }

    const results = [];
    
    for (const page of pagesToProcess) {
      try {
        console.log(`🎨 Processing page ${page.page_id}`);
        const compositedImage = await compositeImagesCanvas(page.coloring_image_url, page.image_url);

        const fileName = `printable-coloring/${bookId}/${page.page_id}_${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage.from('page-images').upload(fileName, compositedImage, { contentType: 'image/png', upsert: true });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('page-images').getPublicUrl(fileName);

        await supabase.from('page_image_urls').update({ printable_coloring_image_url: urlData.publicUrl }).eq('id', page.id);

        console.log(`✅ Successfully processed page ${page.page_id}`);
        results.push({ pageId: page.page_id, status: 'success', url: urlData.publicUrl });

      } catch (pageError) {
        console.error(`❌ Error processing page ${page.page_id}:`, pageError);
        results.push({ pageId: page.page_id, status: 'error', error: pageError.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const remainingAfterBatch = totalRemaining - successCount;

    return successResponse({
      success: true,
      message: `Processed ${pagesToProcess.length} pages this batch`,
      summary: { success: successCount, skipped: 0, errors: errorCount, remaining: remainingAfterBatch },
      hasMore: remainingAfterBatch > 0,
      results
    });
  }

  // Single page processing
  if (!pageId) return errors.badRequest('Missing pageId parameter');

  console.log(`🖼️ Generating printable coloring image for page: ${pageId}`);

  const { data: pageData, error: pageError } = await supabase
    .from('page_image_urls')
    .select('id, book_id, image_url, coloring_image_url')
    .eq('page_id', pageId)
    .eq('is_latest', true)
    .single();

  if (pageError || !pageData) return errors.notFound('Page image data not found');
  if (!pageData.image_url || !pageData.coloring_image_url) return errors.badRequest('Page requires both color image and coloring image');

  const compositedImage = await compositeImagesCanvas(pageData.coloring_image_url, pageData.image_url);

  const fileName = `printable-coloring/${pageData.book_id}/${pageId}_${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage.from('page-images').upload(fileName, compositedImage, { contentType: 'image/png', upsert: true });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from('page-images').getPublicUrl(fileName);
  await supabase.from('page_image_urls').update({ printable_coloring_image_url: urlData.publicUrl }).eq('id', pageData.id);

  console.log(`✅ Successfully generated printable coloring image`);

  return successResponse({ success: true, printableColoringImageUrl: urlData.publicUrl });
}));
