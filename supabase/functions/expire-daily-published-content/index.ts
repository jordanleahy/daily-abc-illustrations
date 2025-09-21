import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      daily_published: {
        Row: {
          id: string;
          book_id: string;
          title: string;
          description?: string;
          published_at: string;
          expires_at?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          queue_position?: number;
          status: string;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    console.log('Starting daily published content expiration process...');

    // Get current timestamp for expiration check
    const now = new Date().toISOString();
    console.log(`Current time: ${now}`);

    // Find all items that should be expired (expires_at < now)
    const { data: itemsToExpire, error: fetchError } = await supabase
      .from('daily_published')
      .select('id, title, expires_at, status, is_active')
      .lt('expires_at', now)
      .in('status', ['active', 'queued'])
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching items to expire:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${itemsToExpire?.length || 0} items to expire`);

    if (!itemsToExpire || itemsToExpire.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No items need expiration',
        expired_count: 0,
        timestamp: now
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract IDs for batch update
    const idsToExpire = itemsToExpire.map(item => item.id);

    // Update all expired items in batch
    const { data: updatedItems, error: updateError } = await supabase
      .from('daily_published')
      .update({
        status: 'expired',
        is_active: false,
        updated_at: now
      })
      .in('id', idsToExpire)
      .select('id, title');

    if (updateError) {
      console.error('Error updating expired items:', updateError);
      throw updateError;
    }

    console.log(`Successfully expired ${updatedItems?.length || 0} items:`, 
      updatedItems?.map(item => `${item.title} (${item.id})`));

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully expired ${updatedItems?.length || 0} items`,
      expired_count: updatedItems?.length || 0,
      expired_items: updatedItems,
      timestamp: now
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in expire-daily-published-content function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});