import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/types.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[CREATE-SCHEDULED-HABITS] Creating scheduled habit completions...');

    // This edge function runs as a cron job with service role
    // It should create habit completions for ALL users with active subscriptions
    // The database RLS policies will handle access control for individual users
    
    // Call the database function that creates today's habit completions
    const { data, error } = await supabase.rpc('create_daily_habit_completions');

    if (error) {
      console.error('Error creating scheduled habits:', error);
      throw error;
    }

    console.log('[CREATE-SCHEDULED-HABITS] Scheduled habits created successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        ...data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CREATE-SCHEDULED-HABITS] Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
