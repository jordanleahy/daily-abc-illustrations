import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  bookId: string;
  bookName: string;
  oldValue: string;
  newValue: string;
  success: boolean;
  error?: string;
}

interface MigrationResponse {
  success: boolean;
  dryRun: boolean;
  timestamp: string;
  totalBooks: number;
  processed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: MigrationResult[];
}

/**
 * Hook to migrate legacy age range values to enum values
 * Admin-only operation
 */
export function useMigrateAgeRanges() {
  return useMutation({
    mutationFn: async ({ dryRun = true }: { dryRun?: boolean } = {}) => {
      console.log(`[Age Range Migration] Starting migration (dry run: ${dryRun})`);
      
      const { data, error } = await supabase.functions.invoke<MigrationResponse>(
        'migrate-age-ranges',
        {
          body: { dryRun },
        }
      );

      if (error) {
        console.error('[Age Range Migration] Error:', error);
        throw new Error(error.message || 'Failed to migrate age ranges');
      }

      if (!data?.success) {
        throw new Error('Migration failed');
      }

      console.log('[Age Range Migration] Migration complete:', {
        totalBooks: data.totalBooks,
        processed: data.processed,
        successCount: data.successCount,
        errorCount: data.errorCount,
        skippedCount: data.skippedCount,
      });

      return data;
    },
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.success(`Migration preview complete: ${data.successCount} books would be updated`);
      } else {
        toast.success(`Successfully migrated ${data.successCount} books`);
      }
    },
    onError: (error: Error) => {
      console.error('[Age Range Migration] Mutation error:', error);
      toast.error(`Migration failed: ${error.message}`);
    },
  });
}
