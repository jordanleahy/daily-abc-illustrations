import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized');

    const { kidProfileId, secondsWatched, videoId } = await req.json();

    console.log('[CONSUME-SCREEN-TIME] Starting consumption', { 
      userId: user.id, 
      kidProfileId, 
      secondsWatched,
      videoId 
    });

    // Verify kid belongs to parent and get coin balance
    const { data: kidProfile, error: kidError } = await supabase
      .from('kid_profiles')
      .select('parent_user_id, earned_coins')
      .eq('id', kidProfileId)
      .single();

    if (kidError || !kidProfile || kidProfile.parent_user_id !== user.id) {
      throw new Error('Kid profile not found or unauthorized');
    }

    // Get screen time product to check coin requirement
    const { data: product } = await supabase
      .from('kid_rewards_products')
      .select('coin_price')
      .eq('parent_user_id', kidProfile.parent_user_id)
      .eq('title', 'Screen Time')
      .eq('is_active', true)
      .single();

    // Option B: Verify user has minimum coins to use screen time
    if (product && kidProfile.earned_coins < product.coin_price) {
      console.error('[consume-screen-time] Insufficient coins to unlock screen time');
      return new Response(
        JSON.stringify({
          success: false,
          error: `Need at least ${product.coin_price} coins to access videos. Current: ${kidProfile.earned_coins}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Use atomic RPC function to deduct screen time
    const { data: result, error: deductError } = await supabase
      .rpc('decrement_screen_time', {
        p_kid_id: kidProfileId,
        p_seconds: secondsWatched
      });

    if (deductError) {
      console.error('[CONSUME-SCREEN-TIME] RPC error', deductError);
      throw deductError;
    }

    if (!result.success) {
      console.log('[CONSUME-SCREEN-TIME] Insufficient balance', { 
        remainingSeconds: result.new_balance 
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error_message,
          remainingSeconds: result.new_balance,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Record session
    const { data: session, error: sessionError } = await supabase
      .from('screen_time_sessions')
      .insert({
        kid_profile_id: kidProfileId,
        parent_user_id: user.id,
        seconds_consumed: secondsWatched,
        video_id: videoId,
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[CONSUME-SCREEN-TIME] Session record failed', sessionError);
    }

    console.log('[CONSUME-SCREEN-TIME] Success', { 
      sessionId: session?.id,
      newBalance: result.new_balance,
      balanceInMinutes: Math.floor(result.new_balance / 60)
    });

    return new Response(
      JSON.stringify({
        success: true,
        remainingSeconds: result.new_balance,
        sessionId: session?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CONSUME-SCREEN-TIME] Error:', error);
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
