import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callAIProvider } from "../_shared/aiProviders.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!theme) {
      return new Response(
        JSON.stringify({ error: 'Theme is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Creating themed book for user:', userId, 'with theme:', theme);

    // Fetch the book-creation agent configuration
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('type', 'book-creation')
      .eq('is_latest', true)
      .maybeSingle();

    if (agentError || !agentData) {
      console.error('Error fetching agent:', agentError);
      return new Response(
        JSON.stringify({ error: 'No book creation agent found. Please configure an agent first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using agent:', agentData.name, 'version:', agentData.version);

    // Create a focused conversation history for themed book creation
    const conversationHistory = [
      {
        role: 'user',
        content: theme
      }
    ];

    // Build the prompt with agent instructions
    const systemPrompt = agentData.instructions || '';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Calling AI provider with', messages.length, 'messages');

    // Call the AI provider
    const aiResponse = await callAIProvider(
      agentData.provider || 'openai',
      agentData.model_settings?.model || 'gpt-5-2025-08-07',
      messages,
      {
        max_completion_tokens: agentData.model_settings?.max_completion_tokens || 16000,
        top_p: agentData.model_settings?.top_p || 1.0,
      }
    );

    console.log('AI Response received:', aiResponse.substring(0, 200));

    // Parse the AI response as JSON
    let bookData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      bookData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse book data from AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the book structure
    if (!bookData.book || !bookData.pages || !Array.isArray(bookData.pages)) {
      console.error('Invalid book structure:', bookData);
      return new Response(
        JSON.stringify({ error: 'Invalid book structure returned by AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating book:', bookData.book.bookName, 'with', bookData.pages.length, 'pages');

    // Insert the book
    const { data: newBook, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: bookData.book.bookName,
        category: bookData.book.category || 'General',
        book_description: bookData.book.bookDescription || '',
        total_pages: bookData.pages.length,
        status: 'draft'
      })
      .select()
      .single();

    if (bookError) {
      console.error('Error creating book:', bookError);
      return new Response(
        JSON.stringify({ error: 'Failed to create book: ' + bookError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Book created with ID:', newBook.id);

    // Insert the pages
    const pagesData = bookData.pages.map((page: any, index: number) => ({
      book_id: newBook.id,
      user_id: userId,
      letter: page.letter,
      page_number: index + 1,
      title: page.title,
      description: page.description || '',
      content: {
        mainConcept: page.content?.mainConcept || '',
        funFact: page.content?.funFact || '',
        activity: page.content?.activity || ''
      }
    }));

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pagesData);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', newBook.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create pages: ' + pagesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pages created successfully');

    // Create a draft daily_published entry
    const { error: dailyPublishedError } = await supabase
      .from('daily_published')
      .insert({
        book_id: newBook.id,
        user_id: userId,
        status: 'draft',
        is_active: false
      });

    if (dailyPublishedError) {
      console.error('Error creating daily_published entry:', dailyPublishedError);
    }

    // Invoke SEO metadata generation asynchronously (don't wait for it)
    supabase.functions.invoke('generate-seo-metadata', {
      body: { bookId: newBook.id }
    }).then(() => {
      console.log('SEO metadata generation initiated');
    }).catch(error => {
      console.error('Failed to initiate SEO generation:', error);
    });

    return new Response(
      JSON.stringify({
        success: true,
        bookId: newBook.id,
        message: `Book "${newBook.book_name}" created successfully with ${bookData.pages.length} pages!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-themed-book function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
