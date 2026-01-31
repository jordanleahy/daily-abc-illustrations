import { createHandler } from '../_shared/handler.ts';
import { successResponse } from '../_shared/response.ts';

Deno.serve(createHandler({
  name: 'create-scheduled-habits',
  clientMode: 'service',
  requireAuth: false, // Cron job - no auth required
}, async ({ supabase }) => {
  console.log('[CREATE-SCHEDULED-HABITS] Creating scheduled habit completions...');

  // This edge function runs as a cron job with service role
  // It should create habit completions for ALL users with active subscriptions
  // The database RLS policies will handle access control for individual users
  
  const { data, error } = await supabase.rpc('create_daily_habit_completions');

  if (error) {
    console.error('Error creating scheduled habits:', error);
    throw error;
  }

  console.log('[CREATE-SCHEDULED-HABITS] Scheduled habits created successfully:', data);

  return successResponse({
    success: true,
    ...data
  });
}));
