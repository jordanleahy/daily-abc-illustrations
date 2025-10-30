import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callAIProvider, parseAIResponse } from '../_shared/aiProviders.ts';

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const requestSchema = z.object({
  conversationHistory: z.array(conversationMessageSchema),
  userId: z.string().uuid()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { conversationHistory, userId } = requestSchema.parse(body);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Google book-creation agent
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('type', 'book-creation')
      .eq('provider', 'google')
      .eq('user_id', userId)
      .eq('is_latest', true)
      .limit(1)
      .single();

    if (agentError || !agents) {
      console.error('Error fetching Google book-creation agent:', agentError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google book-creation agent not configured. Please set up a Google agent first.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agent = {
      id: agents.id,
      provider: agents.provider as 'google',
      model: agents.model,
      max_completion_tokens: agents.max_completion_tokens,
      top_p: agents.top_p,
    };

    console.log('Using Google book-creation agent:', agent);

    // Prepare prompt
    const systemPrompt = agents.instructions || `You are an expert at creating educational ABC books for children. 
Based on the conversation, extract the learning concepts and create a complete ABC book structure.
Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "bookName": "string",
  "category": "string",
  "bookDescription": "string",
  "pages": [
    {
      "letter": "A",
      "pageNumber": 1,
      "title": "string",
      "description": "string",
      "content": {
        "mainConcept": "string",
        "funFact": "string",
        "activity": "string"
      }
    }
  ]
}`;

    const prompt = `Based on this conversation, create a complete ABC book:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Return ONLY valid JSON, no other text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    // Call Google API
    const response = await callAIProvider(agent, messages);
    const aiResponse = await response.json();
    
    console.log('Google API Response:', JSON.stringify(aiResponse).substring(0, 300));

    // Parse response
    let content = parseAIResponse('google', aiResponse);
    
    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Cleaned content:', content.substring(0, 200));

    // Parse JSON
    const bookData = JSON.parse(content);

    // Validate book data structure
    if (!bookData.bookName || !bookData.pages || !Array.isArray(bookData.pages)) {
      throw new Error('Invalid book data structure from Google API');
    }

    console.log(`Creating book: ${bookData.bookName} with ${bookData.pages.length} pages`);

    // Insert book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: bookData.bookName,
        category: bookData.category || 'General',
        book_description: bookData.bookDescription || '',
        total_pages: bookData.pages.length,
        status: 'draft'
      })
      .select()
      .single();

    if (bookError || !book) {
      console.error('Error creating book:', bookError);
      throw new Error('Failed to create book');
    }

    console.log('Book created with ID:', book.id);

    // Insert pages
    const pages = bookData.pages.map((page: any) => ({
      book_id: book.id,
      letter: page.letter,
      page_number: page.pageNumber,
      title: page.title,
      description: page.description || '',
      content: page.content
    }));

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error('Failed to create pages');
    }

    console.log(`Created ${pages.length} pages`);

    // Create draft daily_published entry
    await supabase
      .from('daily_published')
      .insert({
        book_id: book.id,
        status: 'draft',
        is_active: false
      });

    // Trigger SEO generation asynchronously
    supabase.functions.invoke('generate-seo-metadata', {
      body: { bookId: book.id }
    }).catch(err => console.error('Failed to trigger SEO generation:', err));

    return new Response(
      JSON.stringify({ 
        success: true,
        bookId: book.id,
        message: `Book "${bookData.bookName}" created successfully with ${pages.length} pages using Google Gemini!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-create-book function:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request data',
          details: error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
