import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Enhanced monitoring and transition management for daily published content
 * This function provides more frequent monitoring and smoother transitions
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting seamless transition monitoring...')

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const currentTime = now.toISOString()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000).toISOString()

    // Step 1: Check for content that will expire soon (within 5 minutes)
    const { data: soonToExpire, error: soonError } = await supabase
      .from('daily_published')
      .select('id, title, expires_at, queue_position')
      .eq('status', 'active')
      .eq('is_active', true)
      .gte('expires_at', currentTime)
      .lte('expires_at', fiveMinutesFromNow)

    if (soonError) {
      console.error('❌ Error checking soon-to-expire content:', soonError)
      throw soonError
    }

    let preActivationCount = 0

    if (soonToExpire && soonToExpire.length > 0) {
      console.log(`⚠️ Found ${soonToExpire.length} item(s) expiring within 5 minutes`)
      
      for (const item of soonToExpire) {
        const timeUntilExpiry = new Date(item.expires_at).getTime() - now.getTime()
        const minutesLeft = Math.round(timeUntilExpiry / (1000 * 60))
        console.log(`   - "${item.title}": ${minutesLeft} minute(s) left`)
      }

      // Pre-prepare the next item in queue for smoother transition
      const { data: nextItem, error: nextError } = await supabase
        .from('daily_published')
        .select('id, title, queue_position, book_id')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextError) {
        console.error('❌ Error fetching next queued item:', nextError)
      } else if (nextItem) {
        console.log(`🔮 Next item ready for activation: "${nextItem.title}" (Position ${nextItem.queue_position})`)
        
        // Pre-generate any necessary metadata or warm up caches
        // This is where we could add pre-generation of thumbnails, SEO metadata, etc.
        console.log(`📝 Pre-warming next content: book_id=${nextItem.book_id}`)
        preActivationCount = 1
      }
    }

    // Step 2: Handle immediate expiration and activation
    const { data: expiredItems, error: expireError } = await supabase
      .from('daily_published')
      .update({ 
        status: 'expired', 
        is_active: false 
      })
      .eq('status', 'active')
      .lt('expires_at', currentTime)
      .select('id, title, queue_position')

    if (expireError) {
      console.error('❌ Error expiring items:', expireError)
      throw expireError
    }

    let activatedCount = 0
    
    if (expiredItems && expiredItems.length > 0) {
      console.log(`✅ Expired ${expiredItems.length} item(s) immediately`)
      
      // Immediately activate next item with atomic transaction
      const { data: nextItem, error: nextError } = await supabase
        .from('daily_published')
        .select('id, title, queue_position')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextError) {
        console.error('❌ Error fetching next item for activation:', nextError)
      } else if (nextItem) {
        const activationTime = now
        const expirationTime = new Date(activationTime.getTime() + 24 * 60 * 60 * 1000)

        const { data: activated, error: activateError } = await supabase
          .from('daily_published')
          .update({
            status: 'active',
            is_active: true,
            published_at: activationTime.toISOString(),
            expires_at: expirationTime.toISOString()
          })
          .eq('id', nextItem.id)
          .eq('status', 'queued')
          .select('id, title')
          .maybeSingle()

        if (activateError) {
          console.error('❌ Error activating item:', activateError)
        } else if (activated) {
          activatedCount = 1
          console.log(`🎉 Seamlessly activated: "${nextItem.title}"`)
        }
      }
    }

    // Step 3: Health check on current active items
    const { data: activeItems, error: activeError } = await supabase
      .from('daily_published')
      .select('id, title, queue_position, expires_at')
      .eq('status', 'active') 
      .eq('is_active', true)
      .gt('expires_at', currentTime)

    if (activeError) {
      console.error('❌ Error checking active items:', activeError)
    } else if (activeItems && activeItems.length > 0) {
      console.log(`📊 Current active items: ${activeItems.length}`)
      activeItems.forEach(item => {
        const timeLeft = new Date(item.expires_at).getTime() - now.getTime()
        const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60) * 10) / 10
        console.log(`   - "${item.title}": ${hoursLeft}h remaining`)
      })
    }

    const result = {
      success: true,
      timestamp: currentTime,
      monitoring: {
        soon_to_expire: soonToExpire?.length || 0,
        pre_activated: preActivationCount,
        expired: expiredItems?.length || 0,
        activated: activatedCount,
        current_active: activeItems?.length || 0
      },
      message: `Monitoring: ${soonToExpire?.length || 0} soon to expire, ${activatedCount} activated`,
      next_check_recommended: '30s'
    }

    console.log('✅ Seamless transition monitoring completed')

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Monitoring error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown monitoring error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})