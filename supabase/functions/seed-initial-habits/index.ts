import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('Seeding habits for user:', user.id);

    // Step 1: Insert initial habits
    const { data: habits, error: habitsError } = await supabaseClient
      .from('habits')
      .insert([
        {
          parent_user_id: user.id,
          title: 'Hang up pajamas on hook',
          description: 'Please hang up your pajamas on your bed',
          coin_amount: 10,
          frequency: 'daily',
          is_active: true,
          display_order: 0,
        },
        {
          parent_user_id: user.id,
          title: 'Do not play with any toys',
          description: null,
          coin_amount: 10,
          frequency: 'daily',
          is_active: true,
          display_order: 1,
        },
        {
          parent_user_id: user.id,
          title: 'Sit still for mommy to brush your hair',
          description: null,
          coin_amount: 10,
          frequency: 'daily',
          is_active: true,
          display_order: 2,
        },
        {
          parent_user_id: user.id,
          title: 'Make sure your pup pack is ready and on the stroller',
          description: null,
          coin_amount: 10,
          frequency: 'daily',
          is_active: true,
          display_order: 3,
        },
        {
          parent_user_id: user.id,
          title: 'Put your shoes on and your coat',
          description: null,
          coin_amount: 10,
          frequency: 'daily',
          is_active: true,
          display_order: 4,
        },
      ])
      .select();

    if (habitsError) throw habitsError;

    console.log(`Created ${habits.length} habits`);

    // Step 2: Get all active kid profiles for this user
    const { data: kids, error: kidsError } = await supabaseClient
      .from('kid_profiles')
      .select('id')
      .eq('parent_user_id', user.id)
      .eq('is_active', true);

    if (kidsError) throw kidsError;

    console.log(`Found ${kids.length} kids`);

    // Step 3: Create habit assignments for all habits and all kids
    const assignments = [];
    for (const habit of habits) {
      for (const kid of kids) {
        assignments.push({
          habit_id: habit.id,
          kid_profile_id: kid.id,
          parent_user_id: user.id,
          is_active: true,
        });
      }
    }

    if (assignments.length > 0) {
      const { data: createdAssignments, error: assignmentsError } = await supabaseClient
        .from('habit_assignments')
        .insert(assignments)
        .select();

      if (assignmentsError) throw assignmentsError;

      console.log(`Created ${createdAssignments.length} habit assignments`);

      // Step 4: Create today's habit completions
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const completions = createdAssignments.map((assignment) => ({
        habit_assignment_id: assignment.id,
        kid_profile_id: assignment.kid_profile_id,
        parent_user_id: user.id,
        completion_date: today,
        status: 'pending',
      }));

      const { data: createdCompletions, error: completionsError } = await supabaseClient
        .from('habit_completions')
        .insert(completions)
        .select();

      if (completionsError) throw completionsError;

      console.log(`Created ${createdCompletions.length} habit completions for today`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Initial habits seeded successfully',
          data: {
            habits: habits.length,
            assignments: createdAssignments.length,
            completions: createdCompletions.length,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Habits created but no kids found to assign them to',
          data: {
            habits: habits.length,
            assignments: 0,
            completions: 0,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error seeding habits:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
