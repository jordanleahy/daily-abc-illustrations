import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const now = new Date()
    
    console.log('Starting daily published content activation process...')
    console.log('Current time:', now.toISOString())

    // Find queued items that should be activated (published_at <= now)
    const { data: itemsToActivate, error: fetchError } = await supabase
      .from('daily_published')
      .select('id, title, published_at, expires_at')
      .eq('status', 'queued')
      .lte('published_at', now.toISOString())
      .gt('expires_at', now.toISOString()) // Only activate non-expired items
      .order('queue_position', { ascending: true })

    if (fetchError) {
      console.error('Error fetching items to activate:', fetchError)
      throw fetchError
    }

    console.log(`Found ${itemsToActivate?.length || 0} items to activate`)

    if (!itemsToActivate || itemsToActivate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          activated_count: 0,
          message: 'No items need activation'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // First, deactivate any currently active items
    const { error: deactivateError } = await supabase
      .from('daily_published')
      .update({ 
        status: 'expired',
        is_active: false 
      })
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Error deactivating current items:', deactivateError)
      throw deactivateError
    }

    // Activate the first queued item (highest priority by queue_position)
    const itemToActivate = itemsToActivate[0]
    
    const { error: activateError } = await supabase
      .from('daily_published')
      .update({ 
        status: 'active',
        is_active: true 
      })
      .eq('id', itemToActivate.id)

    if (activateError) {
      console.error('Error activating item:', activateError)
      throw activateError
    }

    const activatedItems = [`${itemToActivate.title} (${itemToActivate.id})`]
    console.log('Successfully activated item:', activatedItems[0])

    return new Response(
      JSON.stringify({ 
        success: true, 
        activated_count: 1,
        activated_items: activatedItems
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in activate-daily-published-content function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})