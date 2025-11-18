import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

// Legacy age range mappings - must match frontend LEGACY_AGE_RANGE_MAPPING
const LEGACY_AGE_RANGE_MAPPING: Record<string, string> = {
  'toddler': '2-4',
  'toddlers': '2-4',
  'preschool': '4-6',
  'pre-k': '4-6',
  'prek': '4-6',
  'pre-k/kindergarten': '4-6',
  'kindergarten': '4-6',
  'babies': '0-2',
  'baby': '0-2',
  'infant': '0-2',
  'infants': '0-2',
  'early elementary': '6-8',
  'elementary': '8-10',
  'middle school': '10-12',
};

interface MigrationResult {
  bookId: string;
  bookName: string;
  oldValue: string;
  newValue: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      role_name: 'admin'
    });

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for dry run option
    const { dryRun = false } = await req.json().catch(() => ({ dryRun: false }));

    console.log(`[Age Range Migration] Starting migration (dry run: ${dryRun})`);

    // Fetch all books with targetAge metadata
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, book_name, metadata')
      .not('metadata->targetAge', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch books: ${fetchError.message}`);
    }

    console.log(`[Age Range Migration] Found ${books?.length || 0} books with targetAge metadata`);

    const results: MigrationResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each book
    for (const book of books || []) {
      const metadata = book.metadata as any;
      const oldValue = metadata.targetAge;

      if (!oldValue || typeof oldValue !== 'string') {
        skippedCount++;
        continue;
      }

      const normalized = oldValue.toLowerCase().trim();
      
      // Check if already using enum value
      const validEnums = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12', 'other'];
      if (validEnums.includes(normalized)) {
        console.log(`[Age Range Migration] Book "${book.book_name}" already uses valid enum: ${normalized}`);
        skippedCount++;
        continue;
      }

      // Try to map using legacy mapping
      let newValue = LEGACY_AGE_RANGE_MAPPING[normalized];

      // If no mapping found, try to extract numbers (e.g., "2-4 years" -> "2-4")
      if (!newValue) {
        const numbers = normalized.match(/(\d+)/g);
        if (numbers && numbers.length >= 2) {
          const formatted = `${numbers[0]}-${numbers[1]}`;
          if (validEnums.includes(formatted)) {
            newValue = formatted;
          }
        }
      }

      // If still no mapping, set to 'other'
      if (!newValue) {
        console.warn(`[Age Range Migration] No mapping found for "${oldValue}", defaulting to 'other'`);
        newValue = 'other';
      }

      const result: MigrationResult = {
        bookId: book.id,
        bookName: book.book_name,
        oldValue,
        newValue,
        success: false,
      };

      // Update book metadata if not dry run
      if (!dryRun) {
        const updatedMetadata = {
          ...metadata,
          targetAge: newValue,
        };

        const { error: updateError } = await supabase
          .from('books')
          .update({ metadata: updatedMetadata })
          .eq('id', book.id);

        if (updateError) {
          result.error = updateError.message;
          errorCount++;
          console.error(`[Age Range Migration] Failed to update book "${book.book_name}":`, updateError);
        } else {
          result.success = true;
          successCount++;
          console.log(`[Age Range Migration] Updated book "${book.book_name}": "${oldValue}" → "${newValue}"`);
        }
      } else {
        result.success = true;
        successCount++;
        console.log(`[Age Range Migration] [DRY RUN] Would update book "${book.book_name}": "${oldValue}" → "${newValue}"`);
      }

      results.push(result);
    }

    const summary = {
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      totalBooks: books?.length || 0,
      processed: results.length,
      successCount,
      errorCount,
      skippedCount,
      results,
    };

    console.log('[Age Range Migration] Migration complete:', {
      totalBooks: summary.totalBooks,
      processed: summary.processed,
      successCount: summary.successCount,
      errorCount: summary.errorCount,
      skippedCount: summary.skippedCount,
    });

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Age Range Migration] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
