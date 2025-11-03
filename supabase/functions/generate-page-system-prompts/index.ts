import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { generateSpecializedPrompt } from '../_shared/promptTemplates.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId } = await req.json();

    if (!bookId) {
      return new Response(
        JSON.stringify({ success: false, error: 'bookId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating page system prompts for book:', bookId);

    // Fetch book and pages
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('Error fetching book:', bookError);
      return new Response(
        JSON.stringify({ success: false, error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true });

    if (pagesError || !pages) {
      console.error('Error fetching pages:', pagesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Pages not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pages.length} pages for book: ${book.book_name}`);

    const bookContext = {
      bookName: book.book_name,
      category: book.category || 'educational',
      bookDescription: book.book_description || '',
      theme: book.metadata?.characterTheme,
      characterTheme: book.metadata?.characterTheme,
      targetAge: book.metadata?.targetAge,
      bookType: book.metadata?.bookType
    };

    let promptsCreated = 0;

    // Generate prompts for each page
    for (const page of pages) {
      const isCover = page.page_number === 0;
      
      const pageContext = {
        pageNumber: page.page_number,
        letter: page.letter,
        title: page.title,
        description: page.description || '',
        mainConcept: page.content?.mainConcept
      };

      // Generate specialized prompt
      const promptContent = generateSpecializedPrompt(bookContext, pageContext, isCover);

      // Get version number for this page
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_page_prompt_version_number', { p_page_id: page.id });

      if (versionError) {
        console.error(`Error getting version for page ${page.id}:`, versionError);
        continue;
      }

      const versionNumber = versionData || 1;

      // Insert page system prompt
      const { error: insertError } = await supabase
        .from('page_system_prompts')
        .insert({
          page_id: page.id,
          book_id: bookId,
          user_id: book.user_id,
          version_number: versionNumber,
          content: promptContent,
          is_latest: true,
          is_deployed: true,
          deployed_at: new Date().toISOString(),
          source_type: 'ai_generated',
          generation_metadata: {
            generator: 'generate-page-system-prompts',
            bookType: bookContext.bookType,
            pageType: isCover ? 'cover' : 'content',
            generatedAt: new Date().toISOString()
          }
        });

      if (insertError) {
        console.error(`Error inserting prompt for page ${page.id}:`, insertError);
      } else {
        promptsCreated++;
        console.log(`Created prompt for page ${page.page_number} (${page.letter})`);
      }
    }

    console.log(`Successfully created ${promptsCreated} page system prompts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${promptsCreated} page system prompts`,
        promptsCreated,
        totalPages: pages.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-page-system-prompts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
