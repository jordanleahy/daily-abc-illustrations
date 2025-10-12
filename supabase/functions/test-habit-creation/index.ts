import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Functions: {
      create_daily_habit_completions: {
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
    console.log('🧪 Test Habit Creation started at:', new Date().toISOString());
    
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Call the TEST database function (allows duplicates for testing)
    console.log('📅 Creating daily habit completions for date:', new Date().toISOString().split('T')[0]);
    
    const { data: result, error: processError } = await supabase.rpc('test_create_daily_habit_completions') as { 
      data: any; 
      error: any; 
    };

    if (processError) {
      console.error('❌ Error creating habit completions:', processError);
      throw processError;
    }

    console.log('✅ Habit creation process completed:', result);

    // Log detailed results
    if (result?.success) {
      console.log(`✨ Created ${result.completions_created} habit completion(s)`);
      console.log(`💰 Deposited ${result.total_coins_deposited} total coins`);
      console.log(`📅 Date: ${result.date}`);
    } else {
      console.error('❌ Habit creation failed:', result?.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Habit creation test completed',
        timestamp: new Date().toISOString(),
        results: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Test Habit Creation error:', error);
    
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
