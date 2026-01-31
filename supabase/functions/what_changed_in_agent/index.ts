/**
 * What Changed in Agent Edge Function
 * 
 * Analyzes differences between two agent configurations and provides
 * a user-friendly description of what changed using AI via Lovable AI Gateway.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse } from '../_shared/response.ts';
import { CompareRequest } from '../_shared/types.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Simple, safe fallback diff in case the AI response is empty or fails
function computeFallbackChanges(orig: Record<string, unknown>, next: Record<string, unknown>): string {
  const changes: string[] = [];
  if (orig.name !== next.name) changes.push(`Name updated to "${next.name}"`);
  if (orig.type !== next.type) changes.push(`Type changed to ${next.type}`);
  if (orig.intent !== next.intent) changes.push('Intent updated');
  if (orig.operational_status !== next.operational_status) changes.push(`Status changed to ${next.operational_status}`);
  if (orig.model !== next.model) changes.push(`Model changed to ${next.model}`);
  if (orig.max_completion_tokens !== next.max_completion_tokens) changes.push(`Max tokens set to ${next.max_completion_tokens}`);
  if (orig.top_p !== next.top_p) changes.push(`Top P set to ${next.top_p}`);
  if (orig.instructions !== next.instructions) {
    const origLen = (orig.instructions as string)?.length || 0;
    const nextLen = (next.instructions as string)?.length || 0;
    const direction = nextLen > origLen ? 'expanded' : 'refined';
    changes.push(`Instructions ${direction}`);
  }
  if (changes.length === 0) return 'Minor configuration updates made.';
  if (changes.length === 1) return changes[0] + '.';
  const last = changes.pop();
  return `${changes.join(', ')} and ${last}.`;
}

Deno.serve(createHandler({
  name: 'what_changed_in_agent',
  clientMode: 'service',
  requireAuth: false,
  methods: ['POST'],
}, async ({ req }) => {
  const { originalConfig, newConfig } = await parseBody<CompareRequest>(req);

  console.log('Comparing agent configurations...');

  if (!LOVABLE_API_KEY) {
    const fallback = computeFallbackChanges(originalConfig as Record<string, unknown>, newConfig as Record<string, unknown>);
    return successResponse({ whatChanged: fallback, error: 'LOVABLE_API_KEY not configured' });
  }

  try {
    // Create detailed comparison prompt
    const prompt = `Compare these two AI agent configurations and describe what changed in a concise, user-friendly way. Focus on meaningful changes that could impact the agent's behavior or performance.

ORIGINAL CONFIG:
- Name: "${originalConfig.name}"
- Type: ${originalConfig.type}
- Intent: "${originalConfig.intent}"
- Status: ${originalConfig.operational_status}
- Model: ${originalConfig.model}
- Max Tokens: ${originalConfig.max_completion_tokens}
- Top P: ${originalConfig.top_p}
- Instructions: "${originalConfig.instructions}"

NEW CONFIG:
- Name: "${newConfig.name}"
- Type: ${newConfig.type}
- Intent: "${newConfig.intent}"
- Status: ${newConfig.operational_status}
- Model: ${newConfig.model}
- Max Tokens: ${newConfig.max_completion_tokens}
- Top P: ${newConfig.top_p}
- Instructions: "${newConfig.instructions}"

Provide a clear, concise summary (1-3 sentences) of what changed. Focus on:
1. Instructions/behavior changes
2. Model or performance setting changes
3. Identity changes (name, intent, type)
4. Status changes

If no meaningful changes were detected, respond with "Minor configuration updates made."

Avoid mentioning technical parameter names - use user-friendly language.`;

    console.log('Calling Lovable AI Gateway with model: google/gemini-2.5-flash');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at analyzing AI agent configuration changes and explaining them in clear, user-friendly language.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 5000,
      }),
    });

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`Lovable AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content?.trim();
    
    const finalSummary = aiSummary && aiSummary.length > 0
      ? aiSummary
      : computeFallbackChanges(originalConfig as Record<string, unknown>, newConfig as Record<string, unknown>);

    if (!aiSummary) {
      console.warn('Lovable AI returned empty content; using fallback diff summary.');
    }

    console.log('Change description:', finalSummary);

    return successResponse({ whatChanged: finalSummary });

  } catch (error) {
    console.error('Error in what_changed_in_agent function:', error);
    
    // Build a safe fallback so the UI still shows something meaningful
    const fallbackMessage = computeFallbackChanges(
      originalConfig as Record<string, unknown>, 
      newConfig as Record<string, unknown>
    );
    
    // Return 200 so the save process continues
    return successResponse({ 
      whatChanged: fallbackMessage,
      error: (error as Error).message 
    });
  }
}));