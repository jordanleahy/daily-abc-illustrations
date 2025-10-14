import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface HabitCompletionWithDetails {
  id: string;
  kid_profile_id: string;
  coins_deposited: number;
  habit_assignment_id: string;
  habit_assignments: {
    habits: {
      book_id: string | null;
      coin_amount: number;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🕐 Starting habit expiration process...');

    // Get yesterday's date (anything before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Expiring habits before: ${todayString}`);

    // Fetch all pending completions from previous days with habit details
    const { data: pendingCompletions, error: fetchError } = await supabase
      .from('habit_completions')
      .select(`
        id,
        kid_profile_id,
        coins_deposited,
        completion_date,
        habit_assignment_id,
        habit_assignments!inner(
          habits!inner(
            book_id,
            coin_amount
          )
        )
      `)
      .eq('status', 'pending')
      .lt('completion_date', todayString)
      .returns<HabitCompletionWithDetails[]>();

    if (fetchError) {
      console.error('❌ Error fetching pending completions:', fetchError);
      throw fetchError;
    }

    if (!pendingCompletions || pendingCompletions.length === 0) {
      console.log('✅ No pending habits to expire');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending habits to expire',
          expired_count: 0,
          total_coins_deducted: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${pendingCompletions.length} pending habits to expire`);

    let expiredCount = 0;
    let totalCoinsDeducted = 0;
    const errors: string[] = [];

    // Process each pending completion
    for (const completion of pendingCompletions) {
      try {
        // Determine coins to deduct:
        // - For book habits (has book_id): use habit.coin_amount (total_pages)
        // - For regular habits: use coins_deposited
        const isBookHabit = !!completion.habit_assignments.habits.book_id;
        const coinsToDeduct = isBookHabit
          ? completion.habit_assignments.habits.coin_amount
          : completion.coins_deposited;

        console.log(
          `⏳ Expiring completion ${completion.id}: ${isBookHabit ? 'book' : 'regular'} habit, deducting ${coinsToDeduct} coins`
        );

        // Update completion status to 'expired'
        const { error: updateError } = await supabase
          .from('habit_completions')
          .update({
            status: 'expired',
            marked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', completion.id);

        if (updateError) {
          console.error(`❌ Error updating completion ${completion.id}:`, updateError);
          errors.push(`Completion ${completion.id}: ${updateError.message}`);
          continue;
        }

        // Deduct coins from kid's balance
        const { error: coinError } = await supabase.rpc('decrement_kid_coins', {
          p_kid_id: completion.kid_profile_id,
          p_amount: coinsToDeduct,
        });

        if (coinError) {
          console.error(`❌ Error deducting coins for kid ${completion.kid_profile_id}:`, coinError);
          errors.push(`Coin deduction for kid ${completion.kid_profile_id}: ${coinError.message}`);
          continue;
        }

        expiredCount++;
        totalCoinsDeducted += coinsToDeduct;
        console.log(`✅ Expired completion ${completion.id}, deducted ${coinsToDeduct} coins`);
      } catch (err) {
        console.error(`❌ Error processing completion ${completion.id}:`, err);
        errors.push(`Completion ${completion.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    const summary = {
      success: true,
      message: `Expired ${expiredCount} of ${pendingCompletions.length} pending habits`,
      expired_count: expiredCount,
      total_coins_deducted: totalCoinsDeducted,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('📊 Expiration summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Habit expiration failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
