import { createHandler } from '../_shared/handler.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(createHandler({
  name: 'seed-initial-habits',
  clientMode: 'user', // Uses user's auth for RLS
  requireAuth: true,
}, async ({ supabase, user }) => {
  // Verify user has active subscription (Plus tier required for habits)
  const { data: hasAccess, error: accessError } = await supabase.rpc('has_feature_access', {
    p_user_id: user!.userId,
    p_feature: 'habits_rewards'
  });

  if (accessError || !hasAccess) {
    console.log('[SEED-INITIAL-HABITS] User does not have access to habits feature', { userId: user!.userId });
    return errorResponse(
      'This feature requires an active Plus subscription. Please upgrade to use habits.',
      403,
      { success: false }
    );
  }

  console.log('Seeding habits for user:', user!.userId);

  // Step 1: Insert initial habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .insert([
      {
        parent_user_id: user!.userId,
        title: 'Hang up pajamas on hook',
        description: 'Please hang up your pajamas on your bed',
        coin_amount: 10,
        frequency: 'daily',
        is_active: true,
        display_order: 0,
      },
      {
        parent_user_id: user!.userId,
        title: 'Do not play with any toys',
        description: null,
        coin_amount: 10,
        frequency: 'daily',
        is_active: true,
        display_order: 1,
      },
      {
        parent_user_id: user!.userId,
        title: 'Sit still for mommy to brush your hair',
        description: null,
        coin_amount: 10,
        frequency: 'daily',
        is_active: true,
        display_order: 2,
      },
      {
        parent_user_id: user!.userId,
        title: 'Make sure your pup pack is ready and on the stroller',
        description: null,
        coin_amount: 10,
        frequency: 'daily',
        is_active: true,
        display_order: 3,
      },
      {
        parent_user_id: user!.userId,
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
  const { data: kids, error: kidsError } = await supabase
    .from('kid_profiles')
    .select('id')
    .eq('parent_user_id', user!.userId)
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
        parent_user_id: user!.userId,
        is_active: true,
      });
    }
  }

  if (assignments.length > 0) {
    const { data: createdAssignments, error: assignmentsError } = await supabase
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
      parent_user_id: user!.userId,
      completion_date: today,
      status: 'pending',
    }));

    const { data: createdCompletions, error: completionsError } = await supabase
      .from('habit_completions')
      .insert(completions)
      .select();

    if (completionsError) throw completionsError;

    console.log(`Created ${createdCompletions.length} habit completions for today`);

    return successResponse({
      success: true,
      message: 'Initial habits seeded successfully',
      data: {
        habits: habits.length,
        assignments: createdAssignments.length,
        completions: createdCompletions.length,
      },
    });
  } else {
    return successResponse({
      success: true,
      message: 'Habits created but no kids found to assign them to',
      data: {
        habits: habits.length,
        assignments: 0,
        completions: 0,
      },
    });
  }
}));
