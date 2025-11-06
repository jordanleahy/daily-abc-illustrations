import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import { Image } from 'https://deno.land/x/imagescript@1.2.16/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId } = await req.json();

    if (!bookId) {
      return new Response(
        JSON.stringify({ error: 'bookId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📚 Fetching PNG images for book: ${bookId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all pages with their latest images and metadata
    const { data: images, error: imagesError } = await supabase
      .from('page_image_urls')
      .select(`
        id,
        image_url,
        usage_metadata,
        pages!inner(page_number, letter)
      `)
      .eq('book_id', bookId)
      .eq('is_latest', true)
      .not('image_url', 'is', null)
      .order('pages(page_number)', { ascending: true });

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      throw imagesError;
    }

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images found for this book' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${images.length} pages with images`);

    // Create ZIP using JSZip
    const zip = new JSZip();

    for (const image of images) {
      const pageData = (image.pages as any);
      const pageNumber = pageData.page_number;
      const letter = pageData.letter;
      const filename = `page-${String(pageNumber).padStart(2, '0')}-${letter}.png`;

      try {
        console.log(`📥 Processing page ${pageNumber}: ${letter}`);
        
        let pngBytes: Uint8Array;

        // Check if PNG already exists in metadata
        const pngUrl = image.usage_metadata?.png_url;
        
        if (pngUrl) {
          console.log(`✅ Using existing PNG from storage`);
          const response = await fetch(pngUrl);
          if (!response.ok) {
            throw new Error(`Failed to download PNG: ${response.statusText}`);
          }
          pngBytes = new Uint8Array(await response.arrayBuffer());
        } else {
          console.log(`🔄 Converting WebP to PNG on-the-fly`);
          
          // Download the WebP image
          const response = await fetch(image.image_url);
          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
          }

          const imageBytes = new Uint8Array(await response.arrayBuffer());

          // Convert to PNG
          const decodedImage = await Image.decode(imageBytes);
          pngBytes = await decodedImage.encode();

          // Store PNG for future use
          const storagePath = `${bookId}/page-${String(pageNumber).padStart(2, '0')}-${letter}.png`;
          
          await supabase.storage
            .from('page-images-png')
            .upload(storagePath, pngBytes, {
              contentType: 'image/png',
              upsert: true,
            });

          const { data: urlData } = supabase.storage
            .from('page-images-png')
            .getPublicUrl(storagePath);

          // Update metadata with PNG info
          const updatedMetadata = {
            ...(image.usage_metadata || {}),
            png_url: urlData.publicUrl,
            png_path: storagePath,
            png_size: pngBytes.length,
            converted_at: new Date().toISOString(),
          };

          await supabase
            .from('page_image_urls')
            .update({ usage_metadata: updatedMetadata })
            .eq('id', image.id);

          console.log(`💾 Stored PNG for future use`);
        }
        
        zip.file(filename, pngBytes);
        console.log(`✅ Added ${filename} to ZIP (${(pngBytes.length / 1024).toFixed(2)} KB)`);
        
      } catch (error) {
        console.error(`Error processing page ${pageNumber}:`, error);
      }
    }

    const files = Object.keys(zip.files);
    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to process any images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Creating ZIP with ${files.length} PNG images`);

    const zipBlob = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log(`✅ ZIP created successfully (${(zipBlob.byteLength / 1024 / 1024).toFixed(2)} MB)`);

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="book-images.zip"',
      },
    });

  } catch (error) {
    console.error('Error in download-book-images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
