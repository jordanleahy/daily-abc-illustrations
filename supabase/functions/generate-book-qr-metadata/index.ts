import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    // Check if QR record already exists
    const { data: existingQR, error: qrError } = await supabase
      .from('book_qr_codes')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (qrError && qrError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw qrError;
    }

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

    let qrResult;

    if (existingQR) {
      // Update existing QR code
      const { data, error } = await supabase
        .from('book_qr_codes')
        .update({
          public_url: publicUrl,
          daily_published_id: dailyPublished?.id || null,
          qr_code_config: qrCodeConfig,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQR.id)
        .select()
        .single();

      if (error) throw error;
      qrResult = data;
    } else {
      // Create new QR code record
      const { data, error } = await supabase
        .from('book_qr_codes')
        .insert({
          book_id: bookId,
          user_id: user.id,
          daily_published_id: dailyPublished?.id || null,
          public_url: publicUrl,
          qr_code_config: qrCodeConfig,
          generation_status: 'complete',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      qrResult = data;
    }

    console.log('QR metadata generated successfully:', qrResult.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: qrResult.id,
        publicUrl,
        qrCodeConfig,
        dailyPublishedStatus: dailyPublished?.status || null,
        queuePosition: dailyPublished?.queue_position || null
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