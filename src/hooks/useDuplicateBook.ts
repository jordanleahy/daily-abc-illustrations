import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Book, Page } from '@/types/book';

interface DuplicateBookParams {
  bookId: string;
  userId: string;
}

// Character name replacements for Bluey books (exact word match, case-sensitive)
const CHARACTER_REPLACEMENTS: [string, string][] = [
  ['Bluey', 'Shelly'],
  ['Bingo', 'Thatch'],
  ['Bandit', 'Whistler'],
  ['Chili', 'Chelsea'],
];

const applyReplacements = (text: string | null): string | null => {
  if (!text) return text;
  let result = text;
  for (const [original, replacement] of CHARACTER_REPLACEMENTS) {
    // Word boundary regex for exact match, case-sensitive
    const pattern = new RegExp(`\\b${original}\\b`, 'g');
    result = result.replace(pattern, replacement);
  }
  return result;
};

// Validation: ensure no original names remain
const validateNoOriginalNames = (text: string | null): boolean => {
  if (!text) return true;
  for (const [original] of CHARACTER_REPLACEMENTS) {
    const pattern = new RegExp(`\\b${original}\\b`);
    if (pattern.test(text)) return false;
  }
  return true;
};

const applyReplacementsToJson = (content: any): any => {
  if (!content) return content;
  if (typeof content === 'string') {
    return applyReplacements(content);
  }
  if (Array.isArray(content)) {
    return content.map(applyReplacementsToJson);
  }
  if (typeof content === 'object') {
    const result: any = {};
    for (const key of Object.keys(content)) {
      result[key] = applyReplacementsToJson(content[key]);
    }
    return result;
  }
  return content;
};

export const useDuplicateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, userId }: DuplicateBookParams) => {
      // Fetch the original book
      const { data: originalBook, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError || !originalBook) {
        throw new Error('Failed to fetch original book');
      }

      // Fetch all pages for the original book
      const { data: originalPages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (pagesError) {
        throw new Error('Failed to fetch book pages');
      }

      // Check if this is a Bluey-themed book
      const metadata = originalBook.metadata as { characterTheme?: string } | null;
      const isBlueyBook = metadata?.characterTheme === 'bluey';

      // Apply replacements only for Bluey books
      const newBookName = isBlueyBook 
        ? applyReplacements(originalBook.book_name) 
        : originalBook.book_name;
      const newDescription = isBlueyBook 
        ? applyReplacements(originalBook.book_description) 
        : originalBook.book_description;
      
      // Log replacements
      if (isBlueyBook) {
        console.log('[Duplicate] Bluey book detected - applying character name replacements:', CHARACTER_REPLACEMENTS.map(([o, r]) => `${o} → ${r}`).join(', '));
        console.log('[Duplicate] Original title:', originalBook.book_name);
        console.log('[Duplicate] New title:', newBookName);
      } else {
        console.log('[Duplicate] Non-Bluey book - skipping character replacements');
      }

      // Create new book with replacements applied
      const { data: newBook, error: newBookError } = await supabase
        .from('books')
        .insert({
          user_id: userId,
          book_name: newBookName,
          category: originalBook.category,
          book_description: newDescription,
          total_pages: originalBook.total_pages,
          status: 'draft',
          metadata: applyReplacementsToJson(originalBook.metadata),
        })
        .select()
        .single();

      if (newBookError || !newBook) {
        throw new Error('Failed to create duplicate book');
      }

      // Duplicate all pages (with replacements only for Bluey books)
      const pageIdMapping: Record<string, string> = {}; // Map old page IDs to new page IDs
      
      if (originalPages && originalPages.length > 0) {
        const pagesToInsert = originalPages.map((page) => ({
          book_id: newBook.id,
          letter: page.letter,
          page_identifier: page.page_identifier || page.letter,
          page_number: page.page_number,
          page_type: page.page_type,
          title: isBlueyBook ? applyReplacements(page.title) : page.title,
          description: isBlueyBook ? applyReplacements(page.description) : page.description,
          content: isBlueyBook ? applyReplacementsToJson(page.content) : page.content,
        }));

        const { data: insertedPages, error: insertPagesError } = await supabase
          .from('pages')
          .insert(pagesToInsert)
          .select('id, page_number');

        if (insertPagesError) {
          // If pages insertion fails, try to clean up the book
          await supabase.from('books').delete().eq('id', newBook.id);
          throw new Error('Failed to duplicate book pages');
        }
        
        // Build page ID mapping (original page ID -> new page ID)
        if (insertedPages) {
          originalPages.forEach((originalPage, index) => {
            const newPage = insertedPages.find(p => p.page_number === originalPage.page_number);
            if (newPage) {
              pageIdMapping[originalPage.id] = newPage.id;
            }
          });
        }
        
        // Log page processing
        console.log(`[Duplicate] Processed ${pagesToInsert.length} pages${isBlueyBook ? ' with character replacements' : ''}`);
      }

      // Duplicate page_system_prompts for all pages
      if (Object.keys(pageIdMapping).length > 0) {
        const originalPageIds = Object.keys(pageIdMapping);
        
        // Fetch the latest prompts for each original page
        const { data: originalPrompts, error: promptsError } = await supabase
          .from('page_system_prompts')
          .select('*')
          .in('page_id', originalPageIds)
          .eq('is_latest', true);

        if (!promptsError && originalPrompts && originalPrompts.length > 0) {
          const promptsToInsert = originalPrompts.map((prompt) => ({
            book_id: newBook.id,
            page_id: pageIdMapping[prompt.page_id],
            user_id: userId,
            content: isBlueyBook ? applyReplacements(prompt.content) || prompt.content : prompt.content,
            source_type: 'duplicated',
            prompt_status: prompt.prompt_status,
            is_latest: true,
            is_deployed: false,
            version_number: 1,
            page_letter: prompt.page_letter,
            page_title: isBlueyBook ? applyReplacements(prompt.page_title) : prompt.page_title,
            prompt_type: prompt.prompt_type,
            generation_metadata: prompt.generation_metadata,
          }));

          const { error: insertPromptsError } = await supabase
            .from('page_system_prompts')
            .insert(promptsToInsert);

          if (insertPromptsError) {
            console.warn('[Duplicate] Failed to duplicate page_system_prompts:', insertPromptsError.message);
          } else {
            console.log(`[Duplicate] Duplicated ${promptsToInsert.length} page system prompts`);
          }
        }
      }

      // Validate no original names remain in book (only for Bluey books)
      if (isBlueyBook) {
        const validBook = validateNoOriginalNames(newBook.book_name) && validateNoOriginalNames(newBook.book_description);
        if (!validBook) {
          console.warn('[Duplicate] Warning: Original character names may still exist in book');
        }
      }

      return newBook;
    },
    onSuccess: (newBook) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', newBook.id] });
      toast.success('Book duplicated successfully');
    },
    onError: (error: Error) => {
      console.error('Error duplicating book:', error);
      toast.error(error.message || 'Failed to duplicate book');
    },
  });
};
