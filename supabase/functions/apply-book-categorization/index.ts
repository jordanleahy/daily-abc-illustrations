import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';
import { normalizeBookType } from '../_shared/types.ts';

interface CategorizationChange {
  book_id: string;
  new_book_type: string;
  confidence_score?: number;
  notes?: string;
}

interface ApplyCategorizationRequest {
  changes: CategorizationChange[];
}

Deno.serve(createHandler({
  name: 'apply-book-categorization',
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

  const { changes } = await parseBody<ApplyCategorizationRequest>(req);

  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    return errors.badRequest('No changes provided');
  }

  console.log(`[apply-book-categorization] Applying ${changes.length} categorization changes...`);

  const results: Array<{
    book_id: string;
    book_name?: string;
    success: boolean;
    old_book_type?: string | null;
    new_book_type?: string;
    error?: string;
  }> = [];
  let successCount = 0;
  let errorCount = 0;

  for (const change of changes) {
    try {
      // Validate book type before applying
      const validatedBookType = normalizeBookType(change.new_book_type);
      
      console.log(`[apply-book-categorization] Validating book type: ${change.new_book_type} -> ${validatedBookType}`);
      
      // Fetch current book data
      const { data: book, error: fetchError } = await supabase
        .from('books')
        .select('id, book_name, category, metadata')
        .eq('id', change.book_id)
        .single();

      if (fetchError) throw fetchError;

      const oldCategory = book.category;
      const oldBookType = book.metadata?.bookType || null;

      // Update book metadata with validated bookType
      const updatedMetadata = {
        ...(book.metadata || {}),
        bookType: validatedBookType,
      };

      const { error: updateError } = await supabase
        .from('books')
        .update({ metadata: updatedMetadata })
        .eq('id', change.book_id);

      if (updateError) throw updateError;

      // Log the change
      const { error: logError } = await supabase
        .from('book_categorization_log')
        .insert({
          book_id: change.book_id,
          old_category: oldCategory,
          old_book_type: oldBookType,
          new_book_type: change.new_book_type,
          confidence_score: change.confidence_score || null,
          applied_by: user!.userId,
          can_rollback: true,
          notes: change.notes || null,
        });

      if (logError) throw logError;

      results.push({
        book_id: change.book_id,
        book_name: book.book_name,
        success: true,
        old_book_type: oldBookType,
        new_book_type: change.new_book_type,
      });

      successCount++;
    } catch (error) {
      console.error(`[apply-book-categorization] Error for book ${change.book_id}:`, error);
      results.push({
        book_id: change.book_id,
        success: false,
        error: (error as Error).message,
      });
      errorCount++;
    }
  }

  console.log(`[apply-book-categorization] Complete: ${successCount} success, ${errorCount} errors`);

  return successResponse({
    success: true,
    total_changes: changes.length,
    success_count: successCount,
    error_count: errorCount,
    results,
  });
}));
