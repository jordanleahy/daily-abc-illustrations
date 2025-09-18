/**
 * Generate SEO Metadata for All Books
 * 
 * This function triggers SEO metadata generation for all existing books
 * that don't already have SEO metadata. Runs as a background task to
 * avoid timeouts.
 * 
 * Usage:
 * POST request (no body required)
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * 
 * Returns:
 * - Success: { "success": true, "message": "Processing started", "totalBooks": number }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting SEO generation for all books...');

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, book_name, book_description, user_id')
      .order('created_at', { ascending: false });

    if (booksError) {
      throw new Error(`Failed to fetch books: ${booksError.message}`);
    }

    if (!books || books.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No books found to process',
        totalBooks: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${books.length} books to process`);

    // Background task to process all books
    const processAllBooks = async () => {
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const book of books) {
        try {
          // Check if SEO metadata already exists for this book
          const { data: existingSeo } = await supabase
            .from('seo_metadata')
            .select('id')
            .is('daily_published_id', null)
            .like('source_data', `%"bookId":"${book.id}"%`)
            .eq('is_latest', true)
            .eq('optimization_status', 'complete')
            .maybeSingle();

          if (existingSeo) {
            console.log(`Skipping book ${book.id} - SEO metadata already exists`);
            skippedCount++;
            continue;
          }

          console.log(`Generating SEO for book: ${book.book_name} (${book.id})`);

          // Call generate-seo-metadata function
          const { data, error } = await supabase.functions.invoke('generate-seo-metadata', {
            body: {
              bookId: book.id,
              contentTitle: book.book_name,
              bookDescription: book.book_description,
              userId: book.user_id
            }
          });

          if (error) {
            console.error(`SEO generation failed for book ${book.id}:`, error);
            errorCount++;
          } else {
            console.log(`SEO generated successfully for book ${book.id}:`, data);
            processedCount++;
          }

          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Error processing book ${book.id}:`, error);
          errorCount++;
        }
      }

      console.log(`SEO generation completed. Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    };

    // Start background task
    EdgeRuntime.waitUntil(processAllBooks());

    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      message: 'SEO generation started in background',
      totalBooks: books.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-seo-for-all-books function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});