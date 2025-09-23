import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Functions: {
      admin_update_daily_published_expiration: {
        Args: {
          p_daily_published_id: string
          p_new_expires_at: string
        }
        Returns: {
          success: boolean
          message?: string
          error?: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    console.log('Fixing expiration for current active daily published content...');

    // Call the admin function to fix the specific record
    const { data, error } = await supabase.rpc('admin_update_daily_published_expiration', {
      p_daily_published_id: 'de383fdd-adad-482d-afd1-30baa88f6ea0',
      p_new_expires_at: '2025-09-23 11:01:00+00'
    });

    if (error) {
      console.error('Database error:', error);
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

    console.log('Fix result:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fixed expiration to September 23rd at 7:01 AM ET',
        data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});