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
          daily_published_id?: string
          new_expires_at?: string
          updated_at?: string
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

    // Get request body
    const { dailyPublishedId, newExpiresAt } = await req.json();

    if (!dailyPublishedId || !newExpiresAt) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: dailyPublishedId and newExpiresAt' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Updating expiration for:', { dailyPublishedId, newExpiresAt });

    // Call the admin function
    const { data, error } = await supabase.rpc('admin_update_daily_published_expiration', {
      p_daily_published_id: dailyPublishedId,
      p_new_expires_at: newExpiresAt
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

    console.log('Update result:', data);

    return new Response(
      JSON.stringify(data),
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