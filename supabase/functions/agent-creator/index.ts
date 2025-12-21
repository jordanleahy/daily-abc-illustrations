import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  assembleAgentInstructions, 
  generateBookTypeRecord, 
  generateAgentRecord,
  AgentConfig 
} from "../_shared/instructionTemplates.ts";
import { corsHeaders } from '../_shared/types.ts';

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are an Agent Creator assistant that helps administrators design new specialized book creation agents for Chairlift Habits, an educational children's book platform.

## Your Role
Guide the user through a structured 6-step discovery process to gather all information needed to create a new book creation agent.

## Discovery Steps

### Step 1: Book Type Identification
Ask: "What educational concept should this book type teach?"
Examples: counting, alphabet, colors, shapes, rhyming, opposites, emotions, animals, sight words

After they respond, confirm the book type ID (kebab-case) and display name.

[SUGGEST]
confirm: ✅ Confirm this book type
modify: ✏️ Modify the name
[/SUGGEST]

### Step 2: Target Age Range
Ask: "What age range is this book type designed for?"

[SUGGEST]
1-2: 1-2 years (very simple)
2-3: 2-3 years (toddlers)
3-4: 3-4 years (preschool)
4-5: 4-5 years (pre-K)
5-7: 5-7 years (early readers)
[/SUGGEST]

### Step 3: Page Title Format
Ask: "What format should page titles follow?"
Provide examples based on the book type:
- ABC: "(a) is for apple"
- Numbers: "1 One Apple"
- Opposites: "Big / Small"
- Rhyming: "The cat in the hat sat on the mat"

Have them provide 3 example page titles.

### Step 4: Type-Specific Discovery Questions
Ask: "What choices should users make when creating this book type?"
Maximum 3 discovery questions. Examples:
- ABC: Letter case (lowercase/uppercase/mixed)
- Numbers: Number range (1-10, 10-20, etc.)
- Colors: Color set (primary, rainbow, etc.)

For each question, ask for:
- Question text
- 2-4 options with IDs and labels

[SUGGEST]
add-question: ➕ Add a discovery question
done-questions: ✅ Done adding questions
[/SUGGEST]

### Step 5: Validation Rules
Ask: "What rules must NEVER be broken in this book type?"
Examples:
- Numbers: "Never spell out numbers as words, always use digits (1, 2, 3)"
- ABC: "Every letter A-Z must appear exactly once"
- Rhyming: "Every page title must contain a complete rhyme"

### Step 6: Review & Generate
Summarize all collected information and generate the agent configuration.

Output the final config in a [CONFIG]...[/CONFIG] block as JSON with this structure:
{
  "typeName": "Display Name",
  "typeId": "kebab-case-id",
  "typeDescription": "Brief description for book type",
  "learningType": "Learning Type Badge Text",
  "skillFocus": "Skill Badge Text",
  "pageTitleFormat": "Format description",
  "pageTitleExamples": ["Example 1", "Example 2", "Example 3"],
  "discoveryQuestions": [
    {
      "questionKey": "key_name",
      "questionText": "Question to ask user?",
      "options": [
        { "key": "option-id", "label": "Option Label" }
      ]
    }
  ],
  "validationRules": [
    "Rule 1",
    "Rule 2"
  ],
  "contentPageGuidelines": "Specific guidelines for how content pages should be structured"
}

[SUGGEST]
create-agent: 🚀 Create Agent
edit-config: ✏️ Edit Configuration
start-over: 🔄 Start Over
[/SUGGEST]

## Response Guidelines
- Keep responses concise and focused
- Always include [SUGGEST] blocks for user choices
- Use emojis sparingly in button labels
- Track which step you're on and guide the user through sequentially
- If user provides multiple pieces of info at once, acknowledge and move forward
- Fixed 12-page structure (1 cover + 1 educational + 10 content pages)

## Current Step Tracking
At the end of each response, mentally track:
- Current step (1-6)
- Information gathered so far
- Next action needed`;

// Handle saving the agent to database
async function saveAgentToDatabase(
  supabase: any, 
  config: AgentConfig, 
  userId: string
): Promise<{ success: boolean; error?: string; bookTypeId?: string; agentId?: string }> {
  try {
    console.log('[agent-creator] Saving agent config:', config.typeId);

    // 1. Generate assembled instructions
    const instructions = assembleAgentInstructions(config);
    console.log('[agent-creator] Generated instructions length:', instructions.length);

    // 2. Check if book type already exists
    const { data: existingType } = await supabase
      .from('book_types')
      .select('id')
      .eq('id', config.typeId)
      .single();

    if (existingType) {
      return { success: false, error: `Book type "${config.typeId}" already exists` };
    }

    // 3. Insert book_types record
    const bookTypeRecord = generateBookTypeRecord(config);
    const { error: bookTypeError } = await supabase
      .from('book_types')
      .insert(bookTypeRecord);

    if (bookTypeError) {
      console.error('[agent-creator] Book type insert error:', bookTypeError);
      return { success: false, error: `Failed to create book type: ${bookTypeError.message}` };
    }

    // 4. Insert agents record
    const agentRecord = generateAgentRecord(config, instructions, userId);
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .insert(agentRecord)
      .select('id')
      .single();

    if (agentError) {
      console.error('[agent-creator] Agent insert error:', agentError);
      // Rollback book type
      await supabase.from('book_types').delete().eq('id', config.typeId);
      return { success: false, error: `Failed to create agent: ${agentError.message}` };
    }

    // 5. Insert discovery questions if any
    if (config.discoveryQuestions.length > 0) {
      const discoveryRecords = config.discoveryQuestions.map((q, i) => ({
        agent_type: `book-creation-${config.typeId}`,
        question_key: q.questionKey,
        question_text: q.questionText,
        options: q.options,
        sort_order: i + 1,
        is_active: true
      }));

      const { error: discoveryError } = await supabase
        .from('type_specific_discoveries')
        .insert(discoveryRecords);

      if (discoveryError) {
        console.error('[agent-creator] Discovery insert error:', discoveryError);
        // Non-fatal, continue
      }
    }

    console.log('[agent-creator] Successfully created agent:', agentData.id);
    return { 
      success: true, 
      bookTypeId: config.typeId, 
      agentId: agentData.id 
    };

  } catch (error) {
    console.error('[agent-creator] Save error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages, action, config } = await req.json();

    // Handle save action
    if (action === 'save' && config) {
      const result = await saveAgentToDatabase(supabase, config as AgentConfig, user.id);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle chat flow
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build messages array with system prompt
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    console.log('[agent-creator] Calling AI with', aiMessages.length, 'messages');

    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        stream: true,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[agent-creator] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('[agent-creator] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
