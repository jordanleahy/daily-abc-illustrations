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
  ['Bluey', 'Thatch'],
  ['Chili', 'Shelly'],
  ['Bandit', 'Chelsea'],
  ['Bingo', 'Whistler'],
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

      // Apply replacements to book fields
      const newBookName = applyReplacements(originalBook.book_name);
      const newDescription = applyReplacements(originalBook.book_description);
      
      // Log replacements
      console.log('[Duplicate] Applying character name replacements:', CHARACTER_REPLACEMENTS.map(([o, r]) => `${o} → ${r}`).join(', '));
      console.log('[Duplicate] Original title:', originalBook.book_name);
      console.log('[Duplicate] New title:', newBookName);

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

      // Duplicate all pages with replacements applied
      if (originalPages && originalPages.length > 0) {
        const pagesToInsert = originalPages.map((page) => ({
          book_id: newBook.id,
          letter: page.letter,
          page_identifier: page.page_identifier || page.letter,
          page_number: page.page_number,
          page_type: page.page_type,
          title: applyReplacements(page.title),
          description: applyReplacements(page.description),
          content: applyReplacementsToJson(page.content),
        }));

        const { error: insertPagesError } = await supabase
          .from('pages')
          .insert(pagesToInsert);

        if (insertPagesError) {
          // If pages insertion fails, try to clean up the book
          await supabase.from('books').delete().eq('id', newBook.id);
          throw new Error('Failed to duplicate book pages');
        }
        
        // Log page replacements
        console.log(`[Duplicate] Processed ${pagesToInsert.length} pages with character replacements`);
      }

      // Validate no original names remain in book
      const validBook = validateNoOriginalNames(newBook.book_name) && validateNoOriginalNames(newBook.book_description);
      if (!validBook) {
        console.warn('[Duplicate] Warning: Original character names may still exist in book');
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
