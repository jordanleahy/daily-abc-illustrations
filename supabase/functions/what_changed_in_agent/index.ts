import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentConfig {
  name: string;
  type: 'chat' | 'assistant';
  intent: string;
  status: 'online' | 'offline' | 'processing';
  instructions: string;
  modelSettings: {
    model: string;
    maxCompletionTokens: number;
    topP: number;
  };
}

interface CompareRequest {
  originalConfig: AgentConfig;
  newConfig: AgentConfig;
}

serve(async (req) => {
  console.log('Edge function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request body...');
    const body = await req.text();
    console.log('Raw request body:', body);
    
    const { originalConfig, newConfig }: CompareRequest = JSON.parse(body);
    
    console.log('Parsed originalConfig:', JSON.stringify(originalConfig, null, 2));
    console.log('Parsed newConfig:', JSON.stringify(newConfig, null, 2));
    
    console.log('Comparing agent configurations...');

    // Validate OpenAI API key
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create detailed comparison prompt
    const prompt = `Compare these two AI agent configurations and describe what changed in a concise, user-friendly way. Focus on meaningful changes that could impact the agent's behavior or performance.

ORIGINAL CONFIG:
- Name: "${originalConfig.name}"
- Type: ${originalConfig.type}
- Intent: "${originalConfig.intent}"
- Status: ${originalConfig.status}
- Model: ${originalConfig.modelSettings.model}
- Max Tokens: ${originalConfig.modelSettings.maxCompletionTokens}
- Top P: ${originalConfig.modelSettings.topP}
- Instructions: "${originalConfig.instructions}"

NEW CONFIG:
- Name: "${newConfig.name}"
- Type: ${newConfig.type}
- Intent: "${newConfig.intent}"
- Status: ${newConfig.status}
- Model: ${newConfig.modelSettings.model}
- Max Tokens: ${newConfig.modelSettings.maxCompletionTokens}
- Top P: ${newConfig.modelSettings.topP}
- Instructions: "${newConfig.instructions}"

Provide a clear, concise summary (1-3 sentences) of what changed. Focus on:
1. Instructions/behavior changes
2. Model or performance setting changes
3. Identity changes (name, intent, type)
4. Status changes

If no meaningful changes were detected, respond with "Minor configuration updates made."

Avoid mentioning technical parameter names - use user-friendly language.`;

    console.log('Calling OpenAI API with model: gpt-5-mini-2025-08-07');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at analyzing AI agent configuration changes and explaining them in clear, user-friendly language.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 200, // Note: using max_completion_tokens for GPT-5
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));
    
    const whatChanged = data.choices?.[0]?.message?.content?.trim();
    
    if (!whatChanged) {
      throw new Error('No content received from OpenAI API');
    }

    console.log('Generated change description:', whatChanged);

    return new Response(JSON.stringify({ whatChanged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in what_changed_in_agent function:', error);
    
    // Return a generic message if diff generation fails
    const fallbackMessage = "Agent configuration updated";
    
    return new Response(JSON.stringify({ 
      whatChanged: fallbackMessage,
      error: error.message 
    }), {
      status: 200, // Return 200 so the save process continues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});