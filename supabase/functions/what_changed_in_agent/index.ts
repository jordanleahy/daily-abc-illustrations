/**
 * What Changed in Agent Edge Function
 * 
 * This function analyzes the differences between two agent configurations and provides
 * a user-friendly description of what changed using OpenAI's GPT model.
 * 
 * Purpose:
 * - Compares original and new agent configurations
 * - Uses AI to generate human-readable summaries of changes
 * - Provides fallback logic if AI analysis fails
 * - Helps users understand what modifications were made to their agents
 * 
 * Features:
 * - AI-powered change analysis using GPT-5-mini
 * - Comprehensive fallback system for reliability
 * - CORS support for web application access
 * - Detailed logging for debugging
 * - Always returns success (200) to not interrupt save workflows
 * 
 * Usage:
 * POST request with body: {
 *   "originalConfig": AgentConfig,
 *   "newConfig": AgentConfig
 * }
 * 
 * AgentConfig Structure:
 * {
 *   name: string,
 *   type: 'chat' | 'assistant',
 *   intent: string,
 *   status: 'online' | 'offline' | 'processing',
 *   instructions: string,
 *   modelSettings: {
 *     model: string,
 *     maxCompletionTokens: number,
 *     topP: number
 *   }
 * }
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key for change analysis
 * - SUPABASE_URL: Supabase project URL (for future database integration)
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for future use)
 * 
 * Returns:
 * - Success: { "whatChanged": "User-friendly description of changes" }
 * - With Error: { "whatChanged": "Fallback description", "error": "Error details" }
 * 
 * Examples of Generated Descriptions:
 * - "Instructions expanded and model changed to gpt-5-2025-08-07."
 * - "Name updated to 'ABC Cards Helper' and status changed to online."
 * - "Minor configuration updates made."
 */

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

// Simple, safe fallback diff in case the OpenAI response is empty or fails
function computeFallbackChanges(orig: AgentConfig, next: AgentConfig): string {
  const changes: string[] = [];
  if (orig.name !== next.name) changes.push(`Name updated to "${next.name}"`);
  if (orig.type !== next.type) changes.push(`Type changed to ${next.type}`);
  if (orig.intent !== next.intent) changes.push('Intent updated');
  if (orig.status !== next.status) changes.push(`Status changed to ${next.status}`);
  if (orig.modelSettings?.model !== next.modelSettings?.model) changes.push(`Model changed to ${next.modelSettings.model}`);
  if (orig.modelSettings?.maxCompletionTokens !== next.modelSettings?.maxCompletionTokens) changes.push(`Max tokens set to ${next.modelSettings.maxCompletionTokens}`);
  if (orig.modelSettings?.topP !== next.modelSettings?.topP) changes.push(`Top P set to ${next.modelSettings.topP}`);
  if (orig.instructions !== next.instructions) {
    const delta = (next.instructions?.length || 0) - (orig.instructions?.length || 0);
    const direction = delta > 0 ? 'expanded' : 'refined';
    changes.push(`Instructions ${direction}`);
  }
  if (changes.length === 0) return 'Minor configuration updates made.';
  if (changes.length === 1) return changes[0] + '.';
  const last = changes.pop();
  return `${changes.join(', ')} and ${last}.`;
}
serve(async (req) => {
  console.log('Edge function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Keep parsed configs available for fallback handling
  let originalConfig: AgentConfig | null = null;
  let newConfig: AgentConfig | null = null;

  try {
    console.log('Parsing request body...');
    const body = await req.text();
    console.log('Raw request body:', body);
    
    const parsed: CompareRequest = JSON.parse(body);
    originalConfig = parsed.originalConfig;
    newConfig = parsed.newConfig;
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
        max_completion_tokens: 5000, // Increased to reduce truncation
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
    
    const aiSummary = data.choices?.[0]?.message?.content?.trim();
    const finalSummary = aiSummary && aiSummary.length > 0
      ? aiSummary
      : computeFallbackChanges(originalConfig!, newConfig!);

    if (!aiSummary) {
      console.warn('OpenAI returned empty content; using fallback diff summary.');
    }

    console.log('Change description:', finalSummary);

    return new Response(JSON.stringify({ whatChanged: finalSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in what_changed_in_agent function:', error);
    
    // Build a safe fallback diff so the UI still shows something meaningful
    let fallbackMessage = 'Agent configuration updated';
    try {
      if (originalConfig && newConfig) {
        fallbackMessage = computeFallbackChanges(originalConfig, newConfig);
      }
    } catch (_e) {
      // ignore fallback errors
    }
    
    return new Response(JSON.stringify({ 
      whatChanged: fallbackMessage,
      error: (error as Error).message 
    }), {
      status: 200, // Return 200 so the save process continues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});