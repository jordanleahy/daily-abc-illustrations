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
    const startTime = Date.now()
    console.log('🔄 Starting enhanced daily published queue processing...', { timestamp: new Date().toISOString() })

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Create Supabase client with service role key
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

    const now = new Date()
    const currentTime = now.toISOString()
    
    console.log(`⏰ Processing at: ${currentTime}`)

    // Step 1: Mark expired active items as expired (atomic transaction)
    const { data: expiredItems, error: expireError } = await supabase
      .from('daily_published')
      .update({ 
        status: 'expired', 
        is_active: false 
      })
      .eq('status', 'active')
      .lt('expires_at', currentTime)
      .select('id, title, queue_position, expires_at')

    if (expireError) {
      console.error('❌ Error expiring items:', expireError)
      throw expireError
    }

    let expiredCount = 0
    if (expiredItems && expiredItems.length > 0) {
      expiredCount = expiredItems.length
      console.log(`✅ Expired ${expiredCount} items:`)
      expiredItems.forEach(item => {
        const expiredAgo = now.getTime() - new Date(item.expires_at).getTime()
        console.log(`   - "${item.title}" (pos ${item.queue_position}) - expired ${Math.round(expiredAgo / 1000)}s ago`)
      })
    }

    // Step 2: Check current active status (ensure no gaps)
    const { data: activeItems, error: activeError } = await supabase
      .from('daily_published')
      .select('id, title, queue_position, published_at, expires_at')
      .eq('status', 'active')
      .eq('is_active', true)
      .gt('expires_at', currentTime)
      .order('queue_position', { ascending: true })

    if (activeError) {
      console.error('❌ Error fetching active items:', activeError)
      throw activeError
    }

    let activatedCount = 0
    
    // Step 3: If no active items, immediately activate the next queued item
    if (!activeItems || activeItems.length === 0) {
      console.log('📋 No active content found - activating next item immediately...')
      
      const { data: nextItem, error: nextError } = await supabase
        .from('daily_published')
        .select('id, title, queue_position, book_id')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextError) {
        console.error('❌ Error fetching next queued item:', nextError)
        throw nextError
      }

      if (nextItem) {
        const activationTime = now
        const expirationTime = new Date(activationTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours

        // Use atomic update to prevent race conditions
        const { data: activatedItem, error: activateError } = await supabase
          .from('daily_published')
          .update({
            status: 'active',
            is_active: true,
            published_at: activationTime.toISOString(),
            expires_at: expirationTime.toISOString()
          })
          .eq('id', nextItem.id)
          .eq('status', 'queued') // Ensure it's still queued (prevent race conditions)
          .select('id, title')
          .maybeSingle()

        if (activateError) {
          console.error('❌ Error activating next item:', activateError)
          throw activateError
        }

        if (activatedItem) {
          activatedCount = 1
          console.log(`🎉 Successfully activated: "${nextItem.title}" (Position ${nextItem.queue_position})`)
          console.log(`   ⏰ Active until: ${expirationTime.toISOString()}`)
        } else {
          console.log('⚠️  Item may have been activated by another process (race condition avoided)')
        }
      } else {
        console.log('📝 No queued items available to activate')
      }
    } else {
      console.log(`📊 Found ${activeItems.length} active item(s):`)
      activeItems.forEach(item => {
        const timeLeft = new Date(item.expires_at).getTime() - now.getTime()
        const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60) * 10) / 10
        const minutesLeft = Math.round((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        console.log(`   - "${item.title}" (pos ${item.queue_position}): ${hoursLeft}h ${minutesLeft}m remaining`)
      })
    }

    // Step 4: Clean up queue positions (resequence for consistency)
    const { error: resequenceError } = await supabase.rpc('cleanup_daily_published_queue')
    
    if (resequenceError) {
      console.warn('⚠️ Warning: Queue cleanup failed:', resequenceError)
      // Don't throw - this is not critical for the main process
    } else {
      console.log('✅ Queue positions cleaned up and resequenced')
    }

    const processingTime = Date.now() - startTime
    const summary = {
      success: true,
      timestamp: currentTime,
      processing_time_ms: processingTime,
      actions: {
        expired: expiredCount,
        activated: activatedCount,
        current_active: activeItems?.length || 0
      },
      message: expiredCount > 0 
        ? `Expired ${expiredCount} item(s), activated ${activatedCount} item(s)`
        : activatedCount > 0 
        ? `Activated ${activatedCount} new item(s)`
        : 'Queue is healthy - no changes needed'
    }

    console.log('✅ Enhanced queue processing completed:', { 
      ...summary,
      performance: `${processingTime}ms`
    })

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    
    console.error('❌ Critical queue processing error:', errorDetails)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorDetails.message,
        timestamp: errorDetails.timestamp
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})