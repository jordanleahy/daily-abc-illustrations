import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

const requestSchema = z.object({
  bookId: z.string().uuid().optional(),
  pageImageUrlId: z.string().uuid().optional(),
}).refine(
  (data) => data.bookId || data.pageImageUrlId,
  { message: 'Either bookId or pageImageUrlId is required' }
);

interface ProcessResult {
  pageNumber: number;
  letter: string;
  success: boolean;
  error?: string;
  pngUrl?: string;
  pngSize?: number;
}

Deno.serve(createHandler({
  name: 'generate-png-variants',
  clientMode: 'service',
  requireAuth: false,
}, async ({ supabase, req }) => {
  const body = await req.json();
  const validationResult = requestSchema.safeParse(body);
  
  if (!validationResult.success) {
    return errors.badRequest('Invalid input parameters');
  }

  const { bookId, pageImageUrlId } = validationResult.data;

  console.log(`🎨 Starting PNG generation for ${bookId ? `book: ${bookId}` : `image: ${pageImageUrlId}`}`);

  // Fetch page images to process
  let query = supabase
    .from('page_image_urls')
    .select(`
      id,
      image_url,
      book_id,
      page_id,
      usage_metadata,
      pages!inner(page_number, letter)
    `)
    .eq('is_latest', true)
    .not('image_url', 'is', null);

  if (bookId) {
    query = query.eq('book_id', bookId);
  } else {
    query = query.eq('id', pageImageUrlId);
  }

  const { data: images, error: fetchError } = await query.order('pages(page_number)', { ascending: true });

  if (fetchError) throw fetchError;

  if (!images || images.length === 0) {
    return errors.notFound('No images found to process');
  }

  console.log(`📋 Found ${images.length} images to process`);

  const results: ProcessResult[] = [];

  for (const image of images) {
    const pageData = (image.pages as any);
    const pageNumber = pageData.page_number;
    const letter = pageData.letter;

    try {
      console.log(`🖼️  Processing page ${pageNumber} (${letter})`);

      const existingPngUrl = image.usage_metadata?.png_url;
      if (existingPngUrl) {
        console.log(`✅ PNG already exists for page ${pageNumber}, skipping`);
        results.push({ pageNumber, letter, success: true, pngUrl: existingPngUrl });
        continue;
      }

      const imageResponse = await fetch(image.image_url);
      if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.statusText}`);

      const imageBytes = await imageResponse.arrayBuffer();
      console.log(`📦 Preparing image for storage...`);
      const pngBytes = new Uint8Array(imageBytes);

      const storagePath = `${image.book_id}/page-${String(pageNumber).padStart(2, '0')}-${letter}.png`;

      console.log(`☁️  Uploading to storage: ${storagePath}`);
      const { error: uploadError } = await supabase.storage
        .from('page-images-png')
        .upload(storagePath, pngBytes, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('page-images-png').getPublicUrl(storagePath);
      const pngUrl = urlData.publicUrl;
      const pngSize = pngBytes.length;

      const updatedMetadata = {
        ...(image.usage_metadata || {}),
        png_url: pngUrl,
        png_path: storagePath,
        png_size: pngSize,
        converted_at: new Date().toISOString(),
      };

      await supabase.from('page_image_urls').update({ usage_metadata: updatedMetadata }).eq('id', image.id);

      console.log(`✅ Successfully created PNG for page ${pageNumber} (${(pngSize / 1024).toFixed(2)} KB)`);
      results.push({ pageNumber, letter, success: true, pngUrl, pngSize });

    } catch (error) {
      console.error(`❌ Error processing page ${pageNumber}:`, error);
      results.push({ pageNumber, letter, success: false, error: error.message });
    }
  }

  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.pngSize || 0), 0),
  };

  console.log(`📊 Summary: ${summary.successful}/${summary.total} successful, ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB total`);

  return successResponse({ success: true, summary, results });
}));
