import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reorderedItems } = await req.json();
    
    if (!reorderedItems || !Array.isArray(reorderedItems)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: reorderedItems array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Reordering queue items:', reorderedItems);

    // Validate that all items are queued status only
    const { data: currentItems, error: fetchError } = await supabase
      .from('daily_published')
      .select('id, status')
      .in('id', reorderedItems.map(item => item.id));

    if (fetchError) {
      console.error('Error fetching current items:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check that all items are queued
    const invalidItems = currentItems?.filter(item => item.status !== 'queued') || [];
    if (invalidItems.length > 0) {
      console.error('Attempted to reorder non-queued items:', invalidItems);
      return new Response(
        JSON.stringify({ error: 'Only queued items can be reordered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update queue positions atomically
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      queue_position: item.newPosition,
      updated_at: new Date().toISOString()
    }));

    // Execute updates in a transaction-like manner
    const updatePromises = updates.map(update =>
      supabase
        .from('daily_published')
        .update({ 
          queue_position: update.queue_position,
          updated_at: update.updated_at
        })
        .eq('id', update.id)
        .eq('status', 'queued') // Additional safety check
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors during queue reordering:', errors);
      return new Response(
        JSON.stringify({ error: 'Failed to update some queue positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully reordered queue items');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Queue reordered successfully',
        updatedCount: updates.length 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in reorder-daily-published-queue:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});