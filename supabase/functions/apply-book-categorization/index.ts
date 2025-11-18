import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplyCategorizationRequest {
  changes: Array<{
    book_id: string;
    new_book_type: string;
    confidence_score?: number;
    notes?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { changes }: ApplyCategorizationRequest = await req.json();

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      throw new Error('No changes provided');
    }

    console.log(`[apply-book-categorization] Applying ${changes.length} categorization changes...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      try {
        // Fetch current book data
        const { data: book, error: fetchError } = await supabaseClient
          .from('books')
          .select('id, book_name, category, metadata')
          .eq('id', change.book_id)
          .single();

        if (fetchError) throw fetchError;

        const oldCategory = book.category;
        const oldBookType = book.metadata?.bookType || null;

        // Update book metadata with new bookType
        const updatedMetadata = {
          ...(book.metadata || {}),
          bookType: change.new_book_type,
        };

        const { error: updateError } = await supabaseClient
          .from('books')
          .update({ metadata: updatedMetadata })
          .eq('id', change.book_id);

        if (updateError) throw updateError;

        // Log the change
        const { error: logError } = await supabaseClient
          .from('book_categorization_log')
          .insert({
            book_id: change.book_id,
            old_category: oldCategory,
            old_book_type: oldBookType,
            new_book_type: change.new_book_type,
            confidence_score: change.confidence_score || null,
            applied_by: user.id,
            can_rollback: true,
            notes: change.notes || null,
          });

        if (logError) throw logError;

        results.push({
          book_id: change.book_id,
          book_name: book.book_name,
          success: true,
          old_book_type: oldBookType,
          new_book_type: change.new_book_type,
        });

        successCount++;
      } catch (error) {
        console.error(`[apply-book-categorization] Error for book ${change.book_id}:`, error);
        results.push({
          book_id: change.book_id,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    console.log(`[apply-book-categorization] Complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total_changes: changes.length,
        success_count: successCount,
        error_count: errorCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[apply-book-categorization] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
