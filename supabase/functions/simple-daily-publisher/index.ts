import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { toZonedTime, format } from 'https://esm.sh/date-fns-tz@3';

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
    
    // Parse request body to check schedule type
    const body = await req.text();
    const requestData = body ? JSON.parse(body) : {};
    
    // Check if this is the correct time slot for Eastern Time
    const now = new Date();
    const easternTime = toZonedTime(now, 'America/New_York');
    const easternHour = easternTime.getHours();
    const easternMinute = easternTime.getMinutes();
    
    // Only process if it's 7:01 AM Eastern Time (±2 minutes for tolerance)
    const isCorrectTime = easternHour === 7 && easternMinute >= 0 && easternMinute <= 3;
    
    if (!isCorrectTime) {
      console.log(`⏰ Skipping execution - not 7:01 AM Eastern Time. Current: ${format(easternTime, 'HH:mm zzz')}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Execution skipped - not scheduled time',
          current_eastern_time: format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz'),
          scheduled_time: '07:01 Eastern Time'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log(`✅ Executing at correct Eastern Time: ${format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz')}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Call the enhanced database function to process daily publishing with safety measures
    console.log('📅 Processing daily publishing for date:', new Date().toISOString().split('T')[0]);
    
    const { data: result, error: processError } = await supabase.rpc('process_enhanced_daily_publishing') as { 
      data: any; 
      error: any; 
    };

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
        eastern_time: format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz'),
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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});