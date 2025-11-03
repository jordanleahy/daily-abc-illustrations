/**
 * One-off Edge Function to Delete Duplicate Daily Published Entry
 * 
 * This function is designed to clean up a specific duplicate entry that was created
 * due to a race condition in the auto-add to queue functionality.
 * 
 * Target: faec15e0-0554-4848-9e23-02dd2bb7e6b8
 * Book: Elsa and Anna's Magical Sight Word Adventure
 * 
 * After this cleanup, the race condition fix in ExportsSection.tsx will prevent
 * future duplicates from being created.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The specific duplicate entry ID to delete
const DUPLICATE_ID = 'faec15e0-0554-4848-9e23-02dd2bb7e6b8';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase service role client (has permission to delete)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🗑️ Attempting to delete duplicate entry:', DUPLICATE_ID);

    // First, verify the entry exists and get its details
    const { data: existingEntry, error: fetchError } = await supabase
      .from('daily_published')
      .select('*')
      .eq('id', DUPLICATE_ID)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching entry:', fetchError);
      throw new Error(`Failed to fetch entry: ${fetchError.message}`);
    }

    if (!existingEntry) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Entry not found - may have already been deleted',
          id: DUPLICATE_ID
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    console.log('📋 Found entry to delete:', {
      id: existingEntry.id,
      book_id: existingEntry.book_id,
      title: existingEntry.title,
      slug: existingEntry.slug,
      status: existingEntry.status,
      created_at: existingEntry.created_at
    });

    // Safety check: Only delete if status is 'queued' or 'draft'
    // Do NOT delete active or expired entries
    if (!['queued', 'draft'].includes(existingEntry.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Entry has status '${existingEntry.status}' - only 'queued' or 'draft' entries can be safely deleted`,
          entry: existingEntry
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Delete the duplicate entry
    const { error: deleteError } = await supabase
      .from('daily_published')
      .delete()
      .eq('id', DUPLICATE_ID);

    if (deleteError) {
      console.error('Error deleting entry:', deleteError);
      throw new Error(`Failed to delete entry: ${deleteError.message}`);
    }

    console.log('✅ Successfully deleted duplicate entry');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Duplicate entry deleted successfully',
        deleted_entry: {
          id: existingEntry.id,
          book_id: existingEntry.book_id,
          title: existingEntry.title,
          slug: existingEntry.slug,
          status: existingEntry.status
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
