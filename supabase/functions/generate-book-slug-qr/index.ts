import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

// Generate a URL-safe slug from a book name
function generateSlugFromBookName(bookName: string): string {
  return bookName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

interface RequestBody {
  bookId: string;
}

Deno.serve(createHandler({
  name: 'generate-book-slug-qr',
  clientMode: 'user',
  requireAuth: true,
  methods: ['POST'],
}, async ({ supabase, user, req }) => {
  const { bookId } = await parseBody<RequestBody>(req);
  
  if (!bookId) {
    return errors.badRequest('Missing bookId parameter');
  }

  console.log(`[GENERATE-BOOK-SLUG-QR] Generating for bookId: ${bookId}, userId: ${user!.userId}`);

  // Use service role client for database operations
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch the book and verify ownership
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, book_name, marketing_url, user_id')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    console.error('[GENERATE-BOOK-SLUG-QR] Book fetch error:', bookError);
    return errors.notFound('Book not found');
  }

  // Verify user owns the book (unless admin)
  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user!.userId);

  const isAdmin = userRoles?.some(r => r.role === 'admin');
  
  if (book.user_id !== user!.userId && !isAdmin) {
    return errors.forbidden('You do not have permission to generate QR for this book');
  }

  // Generate or use existing slug
  let slug = book.marketing_url;
  if (!slug) {
    slug = generateSlugFromBookName(book.book_name);
    
    // Check for uniqueness and append suffix if needed
    let uniqueSlug = slug;
    let suffix = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('books')
        .select('id')
        .eq('marketing_url', uniqueSlug)
        .neq('id', bookId)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        break;
      }
      suffix++;
      uniqueSlug = `${slug}-${suffix}`;
    }
    slug = uniqueSlug;

    // Save the generated slug to the book
    const { error: slugUpdateError } = await supabaseAdmin
      .from('books')
      .update({ marketing_url: slug })
      .eq('id', bookId);

    if (slugUpdateError) {
      console.error('[GENERATE-BOOK-SLUG-QR] Failed to update marketing_url:', slugUpdateError);
    }
  }

  // Build the public URL
  const publicUrl = `https://dailyabcillustrations.com/book/${slug}`;
  console.log(`[GENERATE-BOOK-SLUG-QR] Public URL for QR: ${publicUrl}`);

  // Generate QR code using qrserver.com API
  const qrSize = 300;
  const qrMargin = 10;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&margin=${qrMargin}&format=svg&data=${encodeURIComponent(publicUrl)}`;

  console.log(`[GENERATE-BOOK-SLUG-QR] Fetching QR code from: ${qrApiUrl}`);
  
  let qrResponse: Response;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      qrResponse = await fetch(qrApiUrl);
      if (qrResponse.ok) break;
      retries++;
      console.log(`[GENERATE-BOOK-SLUG-QR] QR API retry ${retries}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (fetchError) {
      retries++;
      console.error(`[GENERATE-BOOK-SLUG-QR] QR API fetch error (retry ${retries}):`, fetchError);
      if (retries >= maxRetries) throw fetchError;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!qrResponse!.ok) {
    throw new Error(`QR API returned status ${qrResponse!.status}`);
  }

  const svgContent = await qrResponse!.text();
  const qrCodeImage = `data:image/svg+xml;base64,${btoa(svgContent)}`;

  // QR code config for reference
  const qrCodeConfig = {
    size: qrSize,
    margin: qrMargin,
    format: 'svg',
    url: publicUrl,
    slug: slug
  };

  // Update the book with QR code data
  const { error: updateError } = await supabaseAdmin
    .from('books')
    .update({
      qr_code_image: qrCodeImage,
      qr_code_public_url: publicUrl,
      qr_code_config: qrCodeConfig,
      qr_code_generated_at: new Date().toISOString()
    })
    .eq('id', bookId);

  if (updateError) {
    console.error('[GENERATE-BOOK-SLUG-QR] Failed to update book with QR data:', updateError);
    throw new Error('Failed to save QR code data');
  }

  console.log(`[GENERATE-BOOK-SLUG-QR] Successfully generated QR code for book ${bookId}`);

  return successResponse({
    success: true,
    qrCodeImage,
    publicUrl,
    slug,
    generatedAt: new Date().toISOString()
  });
}));
