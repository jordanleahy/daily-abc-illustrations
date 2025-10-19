import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { bookId } = await req.json();

    if (!bookId) {
      throw new Error('Book ID is required');
    }

    console.log('Generating QR metadata for book:', bookId, 'by user:', user.id);

    // Verify user owns the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, book_name, user_id')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      throw new Error('Book not found or access denied');
    }

    // Get daily published entry (only non-draft entries)
    const { data: dailyPublished, error: dpError } = await supabase
      .from('daily_published')
      .select('*')
      .eq('book_id', bookId)
      .neq('status', 'draft')  // Only valid publishing queue entries
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
      throw new Error('This book must be added to the publishing schedule before generating a QR code. Please add it to the queue first.');
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
    try {
      // Use QR Server API which is more reliable than client libraries
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?format=svg&size=${qrCodeConfig.size}x${qrCodeConfig.size}&margin=${qrCodeConfig.margin}&ecc=M&data=${encodeURIComponent(publicUrl)}`;
      
      console.log('Fetching QR code from API:', qrApiUrl);
      console.log('Public URL length:', publicUrl.length);
      
      const qrResponse = await fetch(qrApiUrl);
      
      console.log('QR API Response Status:', qrResponse.status);
      console.log('QR API Response Content-Type:', qrResponse.headers.get('content-type'));
      
      if (!qrResponse.ok) {
        throw new Error(`QR API returned ${qrResponse.status}: ${qrResponse.statusText}`);
      }
      
      qrSvg = await qrResponse.text();
      
      // More robust SVG validation using regex
      const svgRegex = /<svg[\s\S]*<\/svg>/i;
      if (!qrSvg || !svgRegex.test(qrSvg.trim())) {
        console.error('Invalid SVG response from QR API:');
        console.error('Response length:', qrSvg?.length);
        console.error('Response preview:', qrSvg?.substring(0, 300));
        
        // Check if it's an HTML error page
        if (qrSvg && qrSvg.toLowerCase().includes('<html')) {
          console.error('QR API returned HTML error page');
        }
        
        throw new Error('QR API returned invalid SVG content');
      }
      
      console.log('QR SVG generated successfully, length:', qrSvg.length);
      
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      
      // Retry once with a smaller size if the first attempt fails
      try {
        console.log('Retrying QR generation with fallback parameters...');
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?format=svg&size=200x200&margin=1&ecc=L&data=${encodeURIComponent(publicUrl)}`;
        console.log('Fallback URL:', fallbackUrl);
        
        const retryResponse = await fetch(fallbackUrl);
        
        console.log('Retry Response Status:', retryResponse.status);
        console.log('Retry Response Content-Type:', retryResponse.headers.get('content-type'));
        
        if (retryResponse.ok) {
          qrSvg = await retryResponse.text();
          
          // Use same robust validation for retry
          const svgRegex = /<svg[\s\S]*<\/svg>/i;
          if (qrSvg && svgRegex.test(qrSvg.trim())) {
            console.log('QR code generated successfully on retry');
          } else {
            console.error('Retry response preview:', qrSvg?.substring(0, 300));
            throw new Error('Retry also returned invalid SVG');
          }
        } else {
          throw new Error(`Retry failed: ${retryResponse.status}`);
        }
      } catch (retryError) {
        console.error('QR generation retry also failed:', retryError);
        throw new Error(`Failed to generate QR code: ${qrError instanceof Error ? qrError.message : 'Unknown QR error'}. Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown retry error'}`);
      }
    }
    
    // Convert SVG to data URL using safe encoding
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
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        bookId: bookId,
        dailyPublishedId: dailyPublished.id,
        publicUrl: publicUrl,
        qrCodeConfig: qrCodeConfig,
        qrCodeImage: qrDataUrl,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-book-qr-metadata function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});