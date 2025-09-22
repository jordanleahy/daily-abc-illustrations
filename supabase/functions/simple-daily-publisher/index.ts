import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

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
          status: 'draft' | 'queued' | 'active' | 'expired';
          is_active: boolean;
          published_at: string;
          expires_at?: string;
          publish_date: string;
          created_at: string;
          updated_at: string;
          queue_position?: number;
        };
      };
    };
    Functions: {
      process_simple_daily_publishing: {
        Returns: any;
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
    console.log('🚀 Simple Daily Publisher started at:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Call the database function to process daily publishing  
    console.log('📅 Processing daily publishing for date:', new Date().toISOString().split('T')[0]);
    
    const { data: result, error: processError } = await supabase.rpc('process_simple_daily_publishing');

    if (processError) {
      console.error('❌ Error processing daily publishing:', processError);
      throw processError;
    }

    console.log('✅ Daily publishing process completed:', result);

    // Log the results
    if (result?.changes?.expired_items > 0) {
      console.log(`📤 Expired ${result.changes.expired_items} item(s)`);
    }
    
    if (result?.changes?.activated_items > 0) {
      console.log(`📥 Activated ${result.changes.activated_items} item(s)`);
      console.log(`🎯 Activated item ID: ${result.changes.activated_item_id}`);
    }

    if (result?.current_state) {
      console.log('📊 Current state:', {
        active: result.current_state.active_items,
        queued: result.current_state.queued_items,
        expired: result.current_state.expired_items,
        draft: result.current_state.draft_items
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily publishing processed successfully',
        timestamp: new Date().toISOString(),
        results: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Simple Daily Publisher error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});