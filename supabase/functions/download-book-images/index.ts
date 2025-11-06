import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PageImageData {
  page_number: number;
  letter: string;
  image_url: string | null;
}

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

    console.log(`📚 Fetching images for book: ${bookId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all pages with their latest images
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select(`
        page_number,
        letter,
        page_image_urls!inner(image_url)
      `)
      .eq('book_id', bookId)
      .eq('page_image_urls.is_latest', true)
      .not('page_image_urls.image_url', 'is', null)
      .order('page_number', { ascending: true });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      throw pagesError;
    }

    if (!pages || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images found for this book' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${pages.length} pages with images`);

    // Create ZIP using JSZip
    const zip = new JSZip();

    for (const page of pages) {
      const imageUrl = (page.page_image_urls as any)[0]?.image_url;
      if (!imageUrl) continue;

      try {
        console.log(`📥 Downloading page ${page.page_number}: ${page.letter}`);
        
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error(`Failed to download ${imageUrl}: ${response.statusText}`);
          continue;
        }

        const imageData = await response.arrayBuffer();
        const filename = `page-${String(page.page_number).padStart(2, '0')}-${page.letter}.webp`;
        
        zip.file(filename, new Uint8Array(imageData));

        console.log(`✅ Downloaded ${filename} (${imageData.byteLength} bytes)`);
      } catch (error) {
        console.error(`Error downloading page ${page.page_number}:`, error);
      }
    }

    const files = Object.keys(zip.files);
    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to download any images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Creating ZIP with ${files.length} images`);

    const zipBlob = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log(`✅ ZIP created successfully (${zipBlob.byteLength} bytes)`);

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
