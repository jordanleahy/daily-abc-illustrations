import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { callAIProvider, parseAIResponse } from '../_shared/aiProviders.ts';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json() as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Google chat agent configuration
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('type', 'chat')
      .eq('provider', 'google')
      .eq('user_id', user.id)
      .eq('is_latest', true)
      .limit(1)
      .single();

    if (agentError || !agents) {
      console.error('Error fetching Google chat agent:', agentError);
      return new Response(
        JSON.stringify({ error: 'Google chat agent not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to expected format
    const agent = {
      id: agents.id,
      provider: agents.provider as 'google',
      model: agents.model,
      max_completion_tokens: agents.max_completion_tokens,
      top_p: agents.top_p,
    };

    console.log('Using Google chat agent:', agent);

    // Prepare messages with system prompt
    const systemMessage: Message = {
      role: 'system',
      content: agents.instructions || 'You are a helpful AI assistant for creating educational ABC books.'
    };

    const allMessages = [systemMessage, ...messages];

    // Call Google API
    const response = await callAIProvider(agent, allMessages);
    const aiResponse = await response.json();
    
    console.log('Google API Response:', JSON.stringify(aiResponse).substring(0, 200));

    // Parse response
    const content = parseAIResponse('google', aiResponse);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
