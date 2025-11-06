import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

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

    // Download all images and create ZIP
    const zipData: { filename: string; data: Uint8Array }[] = [];

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
        
        zipData.push({
          filename,
          data: new Uint8Array(imageData)
        });

        console.log(`✅ Downloaded ${filename} (${imageData.byteLength} bytes)`);
      } catch (error) {
        console.error(`Error downloading page ${page.page_number}:`, error);
      }
    }

    if (zipData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to download any images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Creating ZIP with ${zipData.length} images`);

    // Create ZIP manually using simple ZIP structure
    const zip = await createSimpleZip(zipData);

    console.log(`✅ ZIP created successfully (${zip.byteLength} bytes)`);

    return new Response(zip, {
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

// Simple ZIP file creator (ZIP64 format)
async function createSimpleZip(files: { filename: string; data: Uint8Array }[]): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  // Add each file
  for (const file of files) {
    const nameBytes = encoder.encode(file.filename);
    
    // Local file header
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = stored)
    view.setUint16(10, 0, true); // File last modification time
    view.setUint16(12, 0, true); // File last modification date
    view.setUint32(14, crc32(file.data), true); // CRC-32
    view.setUint32(18, file.data.length, true); // Compressed size
    view.setUint32(22, file.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    
    header.set(nameBytes, 30);
    
    chunks.push(header);
    chunks.push(file.data);
    
    // Central directory header
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    
    cdView.setUint32(0, 0x02014b50, true); // Central directory header signature
    cdView.setUint16(4, 20, true); // Version made by
    cdView.setUint16(6, 20, true); // Version needed to extract
    cdView.setUint16(8, 0, true); // General purpose bit flag
    cdView.setUint16(10, 0, true); // Compression method
    cdView.setUint16(12, 0, true); // File last modification time
    cdView.setUint16(14, 0, true); // File last modification date
    cdView.setUint32(16, crc32(file.data), true); // CRC-32
    cdView.setUint32(20, file.data.length, true); // Compressed size
    cdView.setUint32(24, file.data.length, true); // Uncompressed size
    cdView.setUint16(28, nameBytes.length, true); // File name length
    cdView.setUint16(30, 0, true); // Extra field length
    cdView.setUint16(32, 0, true); // File comment length
    cdView.setUint16(34, 0, true); // Disk number start
    cdView.setUint16(36, 0, true); // Internal file attributes
    cdView.setUint32(38, 0, true); // External file attributes
    cdView.setUint32(42, offset, true); // Relative offset of local header
    
    cdHeader.set(nameBytes, 46);
    
    centralDirectory.push(cdHeader);
    offset += header.length + file.data.length;
  }
  
  // Concatenate central directory
  const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
  
  // End of central directory record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  
  eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, files.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, files.length, true); // Total number of central directory records
  eocdView.setUint32(12, cdSize, true); // Size of central directory
  eocdView.setUint32(16, offset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length
  
  // Combine everything
  const totalSize = offset + cdSize + eocd.length;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  
  for (const cd of centralDirectory) {
    result.set(cd, pos);
    pos += cd.length;
  }
  
  result.set(eocd, pos);
  
  return result;
}

// CRC32 implementation
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
