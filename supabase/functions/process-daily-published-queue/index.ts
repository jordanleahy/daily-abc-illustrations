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

    // Use the new fixed schedule processing function
    console.log('🕐 Processing queue with fixed 11:12 PM UTC schedule...')
    
    const { error: processError } = await supabase.rpc('process_daily_published_queue_fixed')
    
    if (processError) {
      console.error('❌ Error processing fixed schedule queue:', processError)
      throw new Error(`Failed to process fixed schedule queue: ${processError.message}`)
    }
    
    console.log('✅ Fixed schedule queue processing completed')
    
    // Get updated queue status for reporting
    const { data: statusCheck } = await supabase
      .from('daily_published')
      .select('id, title, status, queue_position, published_at, expires_at')
      .in('status', ['active', 'queued', 'expired'])
      .order('queue_position', { ascending: true })
    
    const expiredCount = statusCheck?.filter(item => item.status === 'expired').length || 0
    const activatedCount = statusCheck?.filter(item => item.status === 'active').length || 0
    const queuedCount = statusCheck?.filter(item => item.status === 'queued').length || 0
    
    const activatedItem = statusCheck?.find(item => item.status === 'active')
    
    console.log(`📊 Queue status: ${activatedCount} active, ${queuedCount} queued, ${expiredCount} expired`)

    const processingTime = Date.now() - startTime
    const summary = {
      success: true,
      timestamp: currentTime,
      processing_time_ms: processingTime,
      actions: {
        expired: expiredCount,
        activated: activatedCount,
        current_active: activatedCount > 0 ? 1 : 0
      },
      schedule: 'Fixed daily at 11:12 PM UTC',
      message: expiredCount > 0 
        ? `Fixed schedule: Expired ${expiredCount}, activated ${activatedCount} item(s)`
        : activatedCount > 0 
        ? `Fixed schedule: Activated ${activatedCount} new item(s) at 11:12 PM UTC`
        : 'Fixed schedule queue is healthy - no changes needed'
    }

    console.log('✅ Fixed schedule queue processing completed:', { 
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