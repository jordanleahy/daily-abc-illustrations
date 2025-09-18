import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Functions: {
      process_daily_published_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
    console.log('🔄 Starting daily published queue processing...')

    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Mark expired active items as expired
    const { data: expiredItems, error: expireError } = await supabase
      .from('daily_published')
      .update({ 
        status: 'expired', 
        is_active: false 
      })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id, title, queue_position')

    if (expireError) {
      console.error('❌ Error expiring items:', expireError)
      throw expireError
    }

    if (expiredItems && expiredItems.length > 0) {
      console.log(`✅ Expired ${expiredItems.length} items:`, expiredItems.map(item => `${item.title} (pos ${item.queue_position})`))
    }

    // Step 2: Check if we need to activate the next item in queue
    const { data: activeItems, error: activeError } = await supabase
      .from('daily_published')
      .select('id, queue_position, published_at, expires_at')
      .eq('status', 'active')
      .order('queue_position', { ascending: true })

    if (activeError) {
      console.error('❌ Error fetching active items:', activeError)
      throw activeError
    }

    // If no active items, activate the first queued item
    if (!activeItems || activeItems.length === 0) {
      const { data: nextItem, error: nextError } = await supabase
        .from('daily_published')
        .select('id, title, queue_position')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextError) {
        console.error('❌ Error fetching next queued item:', nextError)
        throw nextError
      }

      if (nextItem) {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours from now

        const { error: activateError } = await supabase
          .from('daily_published')
          .update({
            status: 'active',
            is_active: true,
            published_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          })
          .eq('id', nextItem.id)

        if (activateError) {
          console.error('❌ Error activating next item:', activateError)
          throw activateError
        }

        console.log(`🎉 Activated item: ${nextItem.title} (Position ${nextItem.queue_position})`)
      } else {
        console.log('📝 No queued items to activate')
      }
    } else {
      console.log(`📊 Current active items: ${activeItems.length}`)
      activeItems.forEach(item => {
        const timeLeft = new Date(item.expires_at).getTime() - new Date().getTime()
        const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60))
        console.log(`   - Position ${item.queue_position}: ${hoursLeft}h remaining`)
      })
    }

    console.log('✅ Queue processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Queue processed successfully',
        expired: expiredItems?.length || 0,
        active: activeItems?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})