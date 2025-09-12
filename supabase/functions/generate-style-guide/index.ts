import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const stream = url.searchParams.get('stream') === 'true';

  if (stream) {
    // Return Server-Sent Events stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    const sendEvent = (data: any) => {
      const eventData = `data: ${JSON.stringify(data)}\n\n`;
      writer.write(new TextEncoder().encode(eventData));
    };

    // Process streaming in the background
    (async () => {
      try {
        const { bookId, userId, bookMetadata } = await req.json();

        if (!bookId || !userId || !bookMetadata) {
          sendEvent({ step: 'error', message: 'Missing required parameters: bookId, userId, or bookMetadata', timestamp: new Date().toISOString(), status: 'error' });
          return;
        }

        sendEvent({ step: 'init', message: 'Starting style guide generation...', timestamp: new Date().toISOString(), status: 'in-progress' });

        sendEvent({ step: 'config', message: 'Fetching Illustration Director Agent configuration...', timestamp: new Date().toISOString(), status: 'in-progress' });

        // Fetch user's Illustration Director Agent configuration
        const { data: agentConfig, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'illustration-director')
          .eq('is_latest', true)
          .single();

        if (agentError || !agentConfig) {
          sendEvent({ step: 'error', message: 'No Illustration Director Agent configuration found', timestamp: new Date().toISOString(), status: 'error' });
          return;
        }

        sendEvent({ step: 'config', message: `Found agent config: ${agentConfig.name}`, timestamp: new Date().toISOString(), status: 'complete' });

        sendEvent({ step: 'prompt', message: 'Preparing style guide prompt...', timestamp: new Date().toISOString(), status: 'in-progress' });

        // Prepare the prompt for OpenAI - Let the agent use its specialized instructions
        const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

        sendEvent({ step: 'ai', message: 'Calling OpenAI API to generate style guide...', timestamp: new Date().toISOString(), status: 'in-progress' });

        // Call OpenAI API using the agent's model settings
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({
            model: agentConfig.model,
            messages: [
              { role: 'system', content: agentConfig.instructions },
              { role: 'user', content: styleGuidePrompt }
            ],
            max_completion_tokens: agentConfig.max_completion_tokens,
            top_p: parseFloat(agentConfig.top_p),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          sendEvent({ step: 'error', message: `OpenAI API error: ${errorData.error?.message}`, timestamp: new Date().toISOString(), status: 'error' });
          return;
        }

        const data = await response.json();
        const styleGuide = data.choices[0].message.content;

        sendEvent({ step: 'ai', message: `Generated style guide (${styleGuide.length} characters)`, timestamp: new Date().toISOString(), status: 'complete' });

        sendEvent({ step: 'save', message: 'Updating book metadata...', timestamp: new Date().toISOString(), status: 'in-progress' });

        // Store the generated style guide in the book's metadata or pages
        const { error: updateError } = await supabase
          .from('books')
          .update({ 
            book_description: bookMetadata.book_description,
            category: bookMetadata.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookId);

        if (updateError) {
          sendEvent({ step: 'warning', message: 'Failed to update book metadata', timestamp: new Date().toISOString(), status: 'warning' });
        } else {
          sendEvent({ step: 'save', message: 'Book metadata updated successfully', timestamp: new Date().toISOString(), status: 'complete' });
        }

        sendEvent({ 
          step: 'complete', 
          message: 'Style guide generated successfully!', 
          timestamp: new Date().toISOString(),
          status: 'complete',
          styleGuide: styleGuide,
          agentUsed: {
            name: agentConfig.name,
            model: agentConfig.model,
            version: agentConfig.version
          }
        });

      } catch (error) {
        sendEvent({ step: 'error', message: error.message, timestamp: new Date().toISOString(), status: 'error' });
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Original non-streaming implementation as fallback
  try {
    const { bookId, userId, bookMetadata } = await req.json();

    if (!bookId || !userId || !bookMetadata) {
      throw new Error('Missing required parameters: bookId, userId, or bookMetadata');
    }

    console.log('Generating style guide for book:', bookId, 'user:', userId);

    // Fetch user's Illustration Director Agent configuration
    const { data: agentConfig, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'illustration-director')
      .eq('is_latest', true)
      .single();

    if (agentError || !agentConfig) {
      console.error('Failed to fetch illustration director agent config:', agentError);
      throw new Error('No Illustration Director Agent configuration found for user');
    }

    console.log('Found agent config:', agentConfig.name);

    // Prepare the prompt for OpenAI - Let the agent use its specialized instructions
    const styleGuidePrompt = `Please create your visual style guide for this ABC book:

Book Information:
- Name: ${bookMetadata.book_name}
- Category: ${bookMetadata.category || 'General'}
- Description: ${bookMetadata.book_description || 'ABC learning book'}`;

    // Call OpenAI API using the agent's model settings
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentConfig.model,
        messages: [
          { role: 'system', content: agentConfig.instructions },
          { role: 'user', content: styleGuidePrompt }
        ],
        max_completion_tokens: agentConfig.max_completion_tokens,
        top_p: parseFloat(agentConfig.top_p),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const styleGuide = data.choices[0].message.content;

    console.log('Generated style guide length:', styleGuide.length);

    // Store the generated style guide in the book's metadata or pages
    const { error: updateError } = await supabase
      .from('books')
      .update({ 
        book_description: bookMetadata.book_description,
        category: bookMetadata.category,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId);

    if (updateError) {
      console.error('Failed to update book metadata:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      styleGuide: styleGuide,
      agentUsed: {
        name: agentConfig.name,
        model: agentConfig.model,
        version: agentConfig.version
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-style-guide function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});