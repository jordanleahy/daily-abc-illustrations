import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

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

    // Check if book has a daily published entry
    const { data: dailyPublished, error: dpError } = await supabase
      .from('daily_published')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dpError) {
      console.error('Error fetching daily published:', dpError);
    }

    // Generate public URL based on publication status
    let publicUrl: string;
    
    if (dailyPublished) {
      // Use daily published URL for published content
      publicUrl = `https://dailyabcillustrations.com/daily-published/${dailyPublished.id}`;
    } else {
      // Use preview URL for non-published content
      publicUrl = `https://dailyabcillustrations.com/preview/${bookId}`;
    }

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

    // Generate QR code server-side using Deno-compatible library
    console.log('Generating QR code for URL:', publicUrl);
    
    let qrSvg: string;
    try {
      qrSvg = await qrcode(publicUrl, { 
        output: "svg",
        size: 256 
      });
      console.log('QR SVG generated, length:', qrSvg.length);
      console.log('QR SVG preview:', qrSvg.substring(0, 100) + '...');
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      throw new Error(`Failed to generate QR code: ${qrError.message}`);
    }
    
    // Validate SVG content
    if (!qrSvg || typeof qrSvg !== 'string' || !qrSvg.includes('<svg')) {
      console.error('Invalid QR SVG generated:', qrSvg);
      throw new Error('Generated QR code is not a valid SVG');
    }
    
    // Convert SVG to data URL
    const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;

    // Update the book record with QR code data
    console.log('Updating book with QR code data');
    const { data: qrResult, error: qrError } = await supabase
      .from('books')
      .update({
        qr_code_public_url: publicUrl,
        qr_code_image: qrDataUrl,
        qr_code_config: qrCodeConfig,
        qr_code_generated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (qrError) {
      console.error('Error updating book with QR code:', qrError);
      throw new Error(`Failed to update book with QR code: ${qrError.message}`);
    }

    console.log('QR code generated successfully for book:', qrResult);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        bookId: bookId,
        publicUrl: publicUrl,
        qrCodeConfig: qrCodeConfig,
        qrCodeImage: qrDataUrl,
        dailyPublishedId: dailyPublished?.id || null,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-book-qr-metadata function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});