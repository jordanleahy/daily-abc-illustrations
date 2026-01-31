import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface RollbackRequest {
  log_ids?: string[];
  rollback_all_since?: string; // ISO date
}

Deno.serve(createHandler({
  name: 'rollback-categorization',
  clientMode: 'user',
  requireAuth: true,
  methods: ['POST'],
}, async ({ supabase, user, req }) => {
  // Verify admin role
  const { data: hasAdminRole, error: roleError } = await supabase
    .rpc('has_role', { _user_id: user!.userId, _role: 'admin' });

  if (roleError || !hasAdminRole) {
    return errors.forbidden('Admin access required');
  }

  const { log_ids, rollback_all_since } = await parseBody<RollbackRequest>(req);

  console.log('[rollback-categorization] Starting rollback...');

  let query = supabase
    .from('book_categorization_log')
    .select('*')
    .eq('can_rollback', true)
    .is('rollback_at', null);

  if (log_ids && log_ids.length > 0) {
    query = query.in('id', log_ids);
  } else if (rollback_all_since) {
    query = query.gte('applied_at', rollback_all_since);
  } else {
    return errors.badRequest('Must provide either log_ids or rollback_all_since');
  }

  const { data: logs, error: logsError } = await query;

  if (logsError) throw logsError;
  if (!logs || logs.length === 0) {
    return successResponse({
      success: true,
      message: 'No changes to rollback',
      rolled_back_count: 0,
    });
  }

  console.log(`[rollback-categorization] Rolling back ${logs.length} changes...`);

  const results: Array<{
    book_id: string;
    success: boolean;
    restored_to?: string;
    error?: string;
  }> = [];
  let successCount = 0;
  let errorCount = 0;

  for (const log of logs) {
    try {
      // Fetch current book
      const { data: book, error: fetchError } = await supabase
        .from('books')
        .select('metadata')
        .eq('id', log.book_id)
        .single();

      if (fetchError) throw fetchError;

      // Restore old bookType
      const restoredMetadata: Record<string, unknown> = {
        ...(book.metadata || {}),
        bookType: log.old_book_type || undefined,
      };

      // Remove bookType if it was null before
      if (!log.old_book_type) {
        delete restoredMetadata.bookType;
      }

      const { error: updateError } = await supabase
        .from('books')
        .update({ metadata: restoredMetadata })
        .eq('id', log.book_id);

      if (updateError) throw updateError;

      // Mark log as rolled back
      const { error: logError } = await supabase
        .from('book_categorization_log')
        .update({
          rollback_at: new Date().toISOString(),
          can_rollback: false,
        })
        .eq('id', log.id);

      if (logError) throw logError;

      results.push({
        book_id: log.book_id,
        success: true,
        restored_to: log.old_book_type || 'null',
      });

      successCount++;
    } catch (error) {
      console.error(`[rollback-categorization] Error for book ${log.book_id}:`, error);
      results.push({
        book_id: log.book_id,
        success: false,
        error: (error as Error).message,
      });
      errorCount++;
    }
  }

  console.log(`[rollback-categorization] Complete: ${successCount} rolled back, ${errorCount} errors`);

  return successResponse({
    success: true,
    total_logs: logs.length,
    rolled_back_count: successCount,
    error_count: errorCount,
    results,
  });
}));
