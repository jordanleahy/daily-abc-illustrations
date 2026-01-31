import { toZonedTime, format } from 'https://esm.sh/date-fns-tz@3';
import { createHandler } from '../_shared/handler.ts';
import { successResponse } from '../_shared/response.ts';

Deno.serve(createHandler({
  name: 'simple-daily-publisher',
  clientMode: 'service',
  requireAuth: false, // Cron job - no auth needed
  methods: ['POST', 'GET'],
}, async ({ supabase, req }) => {
  console.log('🚀 Simple Daily Publisher started at:', new Date().toISOString());
  
  // Check if this is the correct time slot for Eastern Time
  const now = new Date();
  const easternTime = toZonedTime(now, 'America/New_York');
  const easternHour = easternTime.getHours();
  const easternMinute = easternTime.getMinutes();
  
  // Only process if it's 7:01 AM Eastern Time (±2 minutes for tolerance)
  const isCorrectTime = easternHour === 7 && easternMinute >= 0 && easternMinute <= 3;
  
  if (!isCorrectTime) {
    console.log(`⏰ Skipping execution - not 7:01 AM Eastern Time. Current: ${format(easternTime, 'HH:mm zzz')}`);
    return successResponse({ 
      success: true, 
      message: 'Execution skipped - not scheduled time',
      current_eastern_time: format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz'),
      scheduled_time: '07:01 Eastern Time'
    });
  }
  
  console.log(`✅ Executing at correct Eastern Time: ${format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz')}`);

  // Call the enhanced database function to process daily publishing
  console.log('📅 Processing daily publishing for date:', new Date().toISOString().split('T')[0]);
  
  const { data: result, error: processError } = await supabase.rpc('process_enhanced_daily_publishing');

  if (processError) {
    console.error('❌ Error processing daily publishing:', processError);
    throw processError;
  }

  console.log('✅ Daily publishing process completed:', result);

  // Log the results
  if (result?.changes?.expired_items > 0) {
    console.log(`📤 Expired ${result.changes.expired_items} item(s)`);
  }
  
  if (result?.changes?.activated_items > 0) {
    console.log(`📥 Activated ${result.changes.activated_items} item(s)`);
    console.log(`🎯 Activated item ID: ${result.changes.activated_item_id}`);
  }

  if (result?.current_state) {
    console.log('📊 Current state:', {
      active: result.current_state.active_items,
      queued: result.current_state.queued_items,
      expired: result.current_state.expired_items,
      draft: result.current_state.draft_items
    });
  }

  return successResponse({
    success: true,
    message: 'Daily publishing processed successfully',
    timestamp: new Date().toISOString(),
    eastern_time: format(easternTime, 'yyyy-MM-dd HH:mm:ss zzz'),
    results: result
  });
}));
