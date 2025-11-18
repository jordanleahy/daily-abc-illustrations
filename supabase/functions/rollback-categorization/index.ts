import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RollbackRequest {
  log_ids?: string[];
  rollback_all_since?: string; // ISO date
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

    const { log_ids, rollback_all_since }: RollbackRequest = await req.json();

    console.log('[rollback-categorization] Starting rollback...');

    let query = supabaseClient
      .from('book_categorization_log')
      .select('*')
      .eq('can_rollback', true)
      .is('rollback_at', null);

    if (log_ids && log_ids.length > 0) {
      query = query.in('id', log_ids);
    } else if (rollback_all_since) {
      query = query.gte('applied_at', rollback_all_since);
    } else {
      throw new Error('Must provide either log_ids or rollback_all_since');
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) throw logsError;
    if (!logs || logs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No changes to rollback',
          rolled_back_count: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[rollback-categorization] Rolling back ${logs.length} changes...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const log of logs) {
      try {
        // Fetch current book
        const { data: book, error: fetchError } = await supabaseClient
          .from('books')
          .select('metadata')
          .eq('id', log.book_id)
          .single();

        if (fetchError) throw fetchError;

        // Restore old bookType
        const restoredMetadata = {
          ...(book.metadata || {}),
          bookType: log.old_book_type || undefined,
        };

        // Remove bookType if it was null before
        if (!log.old_book_type) {
          delete restoredMetadata.bookType;
        }

        const { error: updateError } = await supabaseClient
          .from('books')
          .update({ metadata: restoredMetadata })
          .eq('id', log.book_id);

        if (updateError) throw updateError;

        // Mark log as rolled back
        const { error: logError } = await supabaseClient
          .from('book_categorization_log')
          .update({
            rollback_at: new Date().toISOString(),
            can_rollback: false,
          })
          .eq('id', log.id);

        if (logError) throw logError;

        results.push({
          book_id: log.book_id,
          success: true,
          restored_to: log.old_book_type || 'null',
        });

        successCount++;
      } catch (error) {
        console.error(`[rollback-categorization] Error for book ${log.book_id}:`, error);
        results.push({
          book_id: log.book_id,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    console.log(`[rollback-categorization] Complete: ${successCount} rolled back, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total_logs: logs.length,
        rolled_back_count: successCount,
        error_count: errorCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[rollback-categorization] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
