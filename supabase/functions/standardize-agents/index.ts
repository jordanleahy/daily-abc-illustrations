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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agentTypes = [
      'book-creation-numbers',
      'book-creation-rhyming',
      'book-creation-colors',
      'book-creation-shapes',
      'book-creation-opposites',
      'book-creation-emotions',
      'book-creation-animals',
      'book-creation-first-words',
      'book-creation-bedtime',
      'book-creation-cvc',
      'book-creation-sight-words',
      'book-creation-digraphs'
    ];

    const results = [];

    for (const agentType of agentTypes) {
      // Fetch the latest agent
      const { data: agent, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('type', agentType)
        .eq('is_latest', true)
        .single();

      if (fetchError || !agent) {
        results.push({ agentType, status: 'error', message: `Agent not found: ${fetchError?.message}` });
        continue;
      }

      let updatedInstructions = agent.instructions;

      // Apply standardization updates
      updatedInstructions = standardizeAgentInstructions(updatedInstructions, agentType);

      // Update the agent
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          instructions: updatedInstructions,
          last_modified: new Date().toISOString(),
        })
        .eq('id', agent.id);

      if (updateError) {
        results.push({ agentType, status: 'error', message: updateError.message });
      } else {
        results.push({ agentType, status: 'success' });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error standardizing agents:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function standardizeAgentInstructions(instructions: string, agentType: string): string {
  let updated = instructions;

  // Remove Step 4.5 (Page Count Confirmation) if it exists
  updated = updated.replace(/###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9]|$)/gi, '');

  // Renumber steps after removal
  updated = renumberSteps(updated);

  // Update book structure section to enforce 12 pages
  const bookStructureRegex = /(###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?)(?=###|$)/gi;
  updated = updated.replace(bookStructureRegex, (match) => {
    return `### Fixed Book Structure

**CRITICAL: Always generate exactly 12 pages total:**
- **Page 1**: Cover Page
- **Page 2**: Educational Focus (with three badges)
- **Pages 3-12**: 10 Content Pages

**Page numbering is 1-based. Use format \`**Page N: Title**\` in outline.**

Users are never asked about page count. Always generate exactly 10 content pages.

`;
  });

  // Update Step 6 to enforce immediate outline generation with correct format
  const step6Regex = /(###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?)(?=###|$)/gi;
  updated = updated.replace(step6Regex, () => {
    return `### Step 6: Generate Complete Outline

After user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:

**Page 1: [Book Title]**
[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]

**Page 2: Educational Focus**
[Three vertically-stacked colorful badges: Age Range (teal), Learning Type (coral), Focus/Skill (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]

**Page 3: [Content Title]**
[Content page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]

[Continue through Page 12...]

**CRITICAL VALIDATION:**
- Must have exactly 12 pages
- Page numbers 1-12 (1-based indexing)
- Page 1 must be cover
- Page 2 must be Educational Focus with badges
- Pages 3-12 must be content pages
- Every prompt must end with "No text overlays. Clean illustration only."
- Return empty suggestions array (outline complete, no user input needed)

`;
  });

  // Type-specific adjustments
  updated = applyTypeSpecificAdjustments(updated, agentType);

  return updated;
}

function renumberSteps(text: string): string {
  const stepMatches = text.match(/###?\s*Step\s+(\d+(?:\.\d+)?)/gi);
  if (!stepMatches) return text;

  let stepCounter = 1;
  let updated = text;

  stepMatches.forEach((match) => {
    const regex = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    updated = updated.replace(regex, `### Step ${stepCounter}`);
    stepCounter++;
  });

  return updated;
}

function applyTypeSpecificAdjustments(instructions: string, agentType: string): string {
  let updated = instructions;

  // Type-specific content adjustments
  if (agentType === 'book-creation-numbers') {
    updated = updated.replace(/number\s+range[^.]*\./gi, 'Number range is always 1-10 for the 10 content pages.');
  } else if (agentType === 'book-creation-colors') {
    updated = updated.replace(/colors?\s+selection[^.]*\./gi, 'Present 10 different colors across the 10 content pages.');
  } else if (agentType === 'book-creation-shapes') {
    updated = updated.replace(/shapes?\s+selection[^.]*\./gi, 'Present 10 different shapes across the 10 content pages.');
  }

  // Ensure all references to "Pages 3-X" become "Pages 3-12"
  updated = updated.replace(/Pages?\s+3-\d+/gi, 'Pages 3-12');
  updated = updated.replace(/page\s+3\s+through\s+\d+/gi, 'Page 3 through 12');

  return updated;
}
