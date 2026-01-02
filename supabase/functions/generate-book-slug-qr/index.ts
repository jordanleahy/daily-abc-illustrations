import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token for RLS
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { bookId } = await req.json();
    if (!bookId) {
      return new Response(
        JSON.stringify({ error: 'Missing bookId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating book slug QR for bookId: ${bookId}, userId: ${user.id}`);

    // Use service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the book and verify ownership
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, book_name, marketing_url, user_id')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('Book fetch error:', bookError);
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the book (unless admin)
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    
    if (book.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to generate QR for this book' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        console.error('Failed to update marketing_url:', slugUpdateError);
      }
    }

    // Build the public URL
    const publicUrl = `https://dailyabcillustrations.com/book/${slug}`;
    console.log(`Public URL for QR: ${publicUrl}`);

    // Generate QR code using qrserver.com API
    const qrSize = 300;
    const qrMargin = 10;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&margin=${qrMargin}&format=svg&data=${encodeURIComponent(publicUrl)}`;

    console.log(`Fetching QR code from: ${qrApiUrl}`);
    
    let qrResponse: Response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        qrResponse = await fetch(qrApiUrl);
        if (qrResponse.ok) break;
        retries++;
        console.log(`QR API retry ${retries}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (fetchError) {
        retries++;
        console.error(`QR API fetch error (retry ${retries}):`, fetchError);
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
      console.error('Failed to update book with QR data:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save QR code data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated QR code for book ${bookId}`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeImage,
        publicUrl,
        slug,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating book slug QR:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
