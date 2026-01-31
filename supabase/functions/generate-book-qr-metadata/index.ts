import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface QRRequest {
  bookId: string;
}

Deno.serve(createHandler({
  name: 'generate-book-qr-metadata',
  clientMode: 'service',
  requireAuth: true,
  methods: ['POST'],
}, async ({ supabase, user, req }) => {
  const { bookId } = await parseBody<QRRequest>(req);

  if (!bookId) {
    return errors.badRequest('Book ID is required');
  }

  console.log('Generating QR metadata for book:', bookId, 'by user:', user!.userId);

  // Verify user owns the book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, book_name, user_id')
    .eq('id', bookId)
    .eq('user_id', user!.userId)
    .single();

  if (bookError || !book) {
    return errors.notFound('Book not found or access denied');
  }

  // Get daily published entry (only non-draft entries)
  const { data: dailyPublished, error: dpError } = await supabase
    .from('daily_published')
    .select('*')
    .eq('book_id', bookId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dpError) {
    console.error('Error fetching daily published:', dpError);
    throw new Error('Failed to fetch daily published entry');
  }

  // Validate that book is in publishing queue
  if (!dailyPublished) {
    console.log('Book not in publishing queue:', bookId);
    return errors.badRequest('This book must be added to the publishing schedule before generating a QR code. Please add it to the queue first.');
  }

  console.log('Found daily published entry:', dailyPublished.id, 'status:', dailyPublished.status);

  // Generate public URL for the daily published content
  const publicUrl = `https://dailyabcillustrations.com/daily-published/${dailyPublished.id}`;

  // Generate QR code configuration
  const qrCodeConfig = {
    url: publicUrl,
    size: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const
  };

  // Generate QR code using QR Server API for reliability
  console.log('Generating QR code for URL:', publicUrl);
  
  let qrSvg: string;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?format=svg&size=${qrCodeConfig.size}x${qrCodeConfig.size}&margin=${qrCodeConfig.margin}&ecc=M&data=${encodeURIComponent(publicUrl)}`;
  
  console.log('Fetching QR code from API:', qrApiUrl);
  
  const qrResponse = await fetch(qrApiUrl);
  
  if (!qrResponse.ok) {
    // Retry with fallback parameters
    console.log('Retrying QR generation with fallback parameters...');
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?format=svg&size=200x200&margin=1&ecc=L&data=${encodeURIComponent(publicUrl)}`;
    
    const retryResponse = await fetch(fallbackUrl);
    if (!retryResponse.ok) {
      throw new Error(`QR API returned ${retryResponse.status}`);
    }
    qrSvg = await retryResponse.text();
  } else {
    qrSvg = await qrResponse.text();
  }

  // Validate SVG
  const svgRegex = /<svg[\s\S]*<\/svg>/i;
  if (!qrSvg || !svgRegex.test(qrSvg.trim())) {
    throw new Error('QR API returned invalid SVG content');
  }
  
  console.log('QR SVG generated successfully, length:', qrSvg.length);
  
  // Convert SVG to data URL
  const encoder = new TextEncoder();
  const data = encoder.encode(qrSvg);
  const base64 = btoa(String.fromCharCode(...data));
  const qrDataUrl = `data:image/svg+xml;base64,${base64}`;

  // Update the daily published record with QR code data
  console.log('Updating daily published record with QR code data');
  const { data: qrResult, error: qrError } = await supabase
    .from('daily_published')
    .update({
      qr_code_public_url: publicUrl,
      qr_code_image: qrDataUrl,
      qr_code_config: qrCodeConfig,
      qr_code_generated_at: new Date().toISOString()
    })
    .eq('id', dailyPublished.id)
    .select()
    .single();

  if (qrError) {
    console.error('Error updating daily published record with QR code:', qrError);
    throw new Error(`Failed to update daily published record with QR code: ${qrError.message}`);
  }

  console.log('QR code generated successfully for daily published entry:', qrResult);
  
  return successResponse({
    success: true,
    data: {
      bookId: bookId,
      dailyPublishedId: dailyPublished.id,
      publicUrl: publicUrl,
      qrCodeConfig: qrCodeConfig,
      qrCodeImage: qrDataUrl,
      generatedAt: new Date().toISOString()
    }
  });
}));