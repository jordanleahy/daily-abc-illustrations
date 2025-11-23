import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId } = await req.json();
    
    if (!bookId) {
      throw new Error('bookId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('QA Theme Agent: Fetching book and pages for bookId:', bookId);

    // Fetch book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('book_name, book_description, educational_focus, chat_session_id')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('Error fetching book:', bookError);
      throw new Error('Failed to fetch book details');
    }

    // Fetch all pages for the book
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, page_number, letter, title, description')
      .eq('book_id', bookId)
      .order('page_number');

    if (pagesError || !pages) {
      console.error('Error fetching pages:', pagesError);
      throw new Error('Failed to fetch pages');
    }

    // Fetch chat session context if available
    let conversationContext = '';
    if (book.chat_session_id) {
      const { data: session } = await supabase
        .from('gemini_chat_sessions')
        .select('messages')
        .eq('id', book.chat_session_id)
        .single();

      if (session?.messages) {
        const messages = session.messages as any[];
        const userMessages = messages
          .filter((m: any) => m.role === 'user')
          .map((m: any) => m.content)
          .join('\n');
        conversationContext = userMessages.substring(0, 1000); // Limit context size
      }
    }

    // Build prompt for AI to review titles
    const systemPrompt = `You are a QA Theme Agent reviewing page titles for early educational content for children. Your job is to ensure that each page title accurately reflects the original user intent and is engaging for children.

Book Context:
- Book Name: ${book.book_name}
- Description: ${book.book_description || 'Not provided'}
- Educational Focus: ${JSON.stringify(book.educational_focus || {})}
- Original User Input: ${conversationContext || 'Not available'}

Current Pages:
${pages.map(p => `Page ${p.page_number} (${p.letter}): "${p.title}"`).join('\n')}

Review each title and suggest improvements if needed. Focus on:
1. Clarity and simplicity for children
2. Alignment with the educational focus
3. Engagement and interest
4. Consistency with the original user intent

Return your response as a JSON object with only the pages that need updates, in this exact format:
{
  "updates": [
    {
      "pageId": "page-uuid",
      "currentTitle": "current title",
      "improvedTitle": "improved title",
      "reason": "brief reason for change"
    }
  ]
}

If no updates are needed, return: { "updates": [] }`;

    console.log('QA Theme Agent: Calling AI for review');

    // Call Lovable AI for review
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Review the page titles and provide improvements if needed.' }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      throw new Error('AI API request failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    console.log('QA Theme Agent: AI response received');

    // Parse AI response
    let updates: any[] = [];
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        updates = parsed.updates || [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
    }

    console.log('QA Theme Agent: Found', updates.length, 'updates to apply');

    // Apply updates to database
    const appliedUpdates = [];
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('pages')
        .update({ title: update.improvedTitle })
        .eq('id', update.pageId);

      if (updateError) {
        console.error('Failed to update page:', update.pageId, updateError);
      } else {
        appliedUpdates.push(update);
        console.log('Updated page', update.pageId, ':', update.currentTitle, '->', update.improvedTitle);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatesApplied: appliedUpdates.length,
        updates: appliedUpdates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('QA Theme Agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
