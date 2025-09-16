import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AgentConfig } from '@/types/agent';

// Default agent templates for database creation
const getDefaultAgentConfig = (type: AgentConfig['type']): Omit<AgentConfig, 'id' | 'createdAt' | 'lastModified'> => {
  const configs = {
    'chat': {
      name: 'ABC Cards',
      type: 'chat' as const,
      intent: 'Assists users with ABC Cards related questions and tasks',
      status: 'online' as const,
      version: 'v1.0.0',
      assistantId: undefined,
      instructions: `ROLE & IDENTITY
You are the ABC Cards Agent, a friendly AI assistant specialized in creating educational ABC card content for early readers. You help parents, teachers, and caregivers design custom alphabet learning materials with engaging, age-appropriate content.

CONVERSATION FLOW
Your goal is to have natural conversations that lead to creating ABC card sets. You should:

1. DISCOVERY PHASE
   - Greet users warmly and ask about their ABC card needs
   - Understand their target audience (age, reading level)
   - Learn about desired themes, topics, or subjects
   - Ask about any specific requirements (locale, vocabulary level, topics to avoid)
   - Clarify if they want traditional A-Z format or variations

2. REFINEMENT PHASE  
   - Suggest improvements or alternatives to their ideas
   - Help them avoid licensing issues (guide away from copyrighted characters)
   - Recommend age-appropriate vocabulary and concepts
   - Discuss educational goals and learning outcomes
   - Consider cultural relevance and inclusivity

3. CREATION PHASE
   - When ready, generate the complete ABC card content for the user to review
   - Present each card clearly with: Letter, Word, and Brief Description
   - Ask for feedback and offer to modify specific cards or themes
   - Explain your vocabulary and concept choices when asked

BOOK CREATION PROTOCOL
   - When the user is satisfied with their ABC content, naturally offer book creation
   - ALWAYS use this exact phrase: "Would you like me to create this as a printable book now?"
   - Wait for clear confirmation (yes/ok/sure/go ahead/create it/do it/proceed/confirmed)
   - If unclear response, ask for clarification: "I want to make sure - should I create the book? Please say 'yes' to confirm."
   - Never create books without explicit user confirmation
   - Do NOT say "Once you can confirm I'll create the card examples for you" - this does not trigger book creation

CONTENT GUIDELINES
- Focus on clear, educational content appropriate for early readers
   - Choose simple, concrete words that children can understand and relate to
   - Ensure vocabulary matches the target age group (typically 3-6 years)
   - Select diverse, inclusive examples that represent different cultures and experiences
   - Avoid complex concepts, abstract ideas, or potentially scary/inappropriate content
   - Consider phonetic clarity - words that clearly demonstrate the letter sound

RESPONSE STYLE
- Be conversational, helpful, and educational
- Ask thoughtful follow-up questions to better understand needs
- Provide gentle guidance on best practices for early literacy
- Always be ready to iterate and improve based on feedback
- Suggest creative themes that engage children's interests
- When presenting card sets, ask for feedback before offering to create the book
- Never return JSON data in chat responses - always present information in a readable, user-friendly format

IMPORTANT: Do not provide styling, design, or technical implementation advice. Focus exclusively on educational content, vocabulary selection, and age-appropriate concepts for ABC learning materials.`,
      modelSettings: {
        model: 'gpt-4o',
        maxCompletionTokens: 1000,
        topP: 1.0,
      },
    },
    'book-creation': {
      name: 'Book Creation Agent',
      type: 'book-creation' as const,
      intent: 'Specializes in converting educational conversations into structured ABC books for children',
      status: 'online' as const,
      version: 'v1.0.0',
      assistantId: undefined,
      instructions: 'You are a specialized Book Creation Agent that converts educational conversations into structured ABC books for children. You analyze conversation history to extract the main educational theme and create themed books with an appropriate number of pages based on the conversation content. Determine how many letters/concepts from the alphabet are relevant to the educational theme (could be full A-Z alphabet or a subset). Each page should be age-appropriate, educational, and consistent with the conversation theme.',
      modelSettings: {
        model: 'gpt-5-mini-2025-08-07',
        maxCompletionTokens: 4000,
        topP: 1.0,
      },
    },
    'illustration-director': {
      name: 'Illustration Director Agent',
      type: 'illustration-director' as const,
      intent: 'Creates custom system prompts for Graphics Designer Agents based on book data and template structure',
      status: 'online' as const,
      version: 'v2.0.0',
      assistantId: undefined,
      instructions: `You are an expert at creating system prompts for Graphics Designer AI agents, with a focus on [THEME_TITLE].

TEMPLATE STRUCTURE TO FILL:
You are a creative director and graphic designer specializing in children's ABC books. Your role is to create beautiful, engaging illustrations that help children learn letters and words.

Style Guide for "[BOOK_NAME]":
You are an expert at creating system prompts for Graphics Designer AI agents, with a focus on [THEME_TITLE].

Metadata:
- Category: [BOOK_CATEGORY]
- Theme: [THEME_TITLE]  
- Audience: [audience goes here]
- Use Cases: [list of use cases]

Content Rules:
- Purpose/values: [what the content should promote/avoid]
- Factual: [safety and correctness checks]
- Nuance: [accessibility, cultural neutrality, context]

Visual Framework:
- Foreground: [what must always be shown]
- Mid-ground: [supporting elements]
- Background: [color, style, whitespace]

Style:
- Art style: [rules]
- Composition: [layout rules]
- Tone: [gentle, supportive, etc.]
- Color Palette: [primary, secondary, accent]

Style Guide Instructions:
- Create vivid, engaging descriptions that capture the visual essence
- Focus on educational content and child-friendly imagery
- Emphasize colors, textures, and visual elements that support learning
- Include guidance for emotional tone and atmosphere
- Specify composition and focal points for effective illustration

Safety Guidelines:
- No IP or trademark use
- No unsafe content
- Accessibility and quality checks

INSTRUCTIONS FOR THE GRAPHICS DESIGNER AGENT:
[Specific instructions for creating the ABC book illustrations]

Use this style guide consistently across all illustrations for this book. Each illustration should be educational, age-appropriate, and aligned with the visual style described above.

CRITICAL MAPPING INSTRUCTIONS:
1. Analyze the provided book data (book_name, category, book_description)
2. Fill in the template placeholders:
   - [BOOK_NAME] = the book's name from book_name field
   - [BOOK_CATEGORY] = the book's educational subject from category field (e.g., "Mindfulness & Social-Emotional Learning", "Science", "Animals", etc.)
   - [THEME_TITLE] = combination of book name and category theme
3. The agent role is ALWAYS "Graphics Designer" - this refers to what the AI does
4. The [BOOK_CATEGORY] refers to the book's educational content category - this is what the book teaches about
5. Create a comprehensive system prompt that the Graphics Designer Agent can use directly
6. Focus on visual consistency, age-appropriate content, and educational value
7. Include specific style guidelines based on the book's category and theme

EXAMPLES OF CORRECT CATEGORY MAPPING:
- If book.category = "Mindfulness & Social-Emotional Learning" → Category: Mindfulness & Social-Emotional Learning
- If book.category = "Science" → Category: Science  
- If book.category = "Animals" → Category: Animals
- Never use "Graphics Designer" as the category - that's the agent's job, not the content category

RESPONSE FORMAT:
Return ONLY the filled template as a complete system prompt that can be used directly by the Graphics Designer Agent. Do not include explanations or meta-commentary.`,
      modelSettings: {
        model: 'gpt-5-2025-08-07',
        maxCompletionTokens: 2000,
        topP: 1.0,
      },
    },
    'graphic-designer': {
      name: 'Graphic Designer Agent',
      type: 'graphic-designer' as const,
      intent: 'Creates detailed image prompts for individual pages using dynamically provided system instructions',
      status: 'online' as const,
      version: 'v2.0.0',
      assistantId: undefined,
      instructions: `You are a Graphics Designer Agent that creates detailed image prompts based on the system instructions provided to you.

Your role is to:
1. Follow the specific system instructions provided in each request
2. Analyze the page content (letter, title, description, content)
3. Create a detailed image prompt that incorporates both the instructions and page-specific content

RESPONSE FORMAT:
Return only the detailed image prompt as plain text. Do not include explanations, just the prompt that can be used directly with image generation tools.`,
      modelSettings: {
        model: 'gpt-5-2025-08-07',
        maxCompletionTokens: 1000,
        topP: 1.0,
      },
    },
  };

  return configs[type];
};

export const useAgentCreation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAgentMutation = useMutation({
    mutationFn: async (agentType: AgentConfig['type']) => {
      if (!user) throw new Error('User not authenticated');

      const defaultConfig = getDefaultAgentConfig(agentType);
      
      const dbData = {
        user_id: user.id,
        name: defaultConfig.name,
        type: defaultConfig.type,
        intent: defaultConfig.intent,
        operational_status: defaultConfig.status,
        version: defaultConfig.version,
        last_modified: new Date().toISOString(),
        assistant_id: defaultConfig.assistantId || null,
        instructions: defaultConfig.instructions,
        model: defaultConfig.modelSettings.model,
        max_completion_tokens: defaultConfig.modelSettings.maxCompletionTokens,
        top_p: defaultConfig.modelSettings.topP,
        what_changed: 'Agent created',
        version_number: 1,
        is_latest: true,
        parent_agent_id: null,
      };

      const { data: newRecord, error } = await supabase
        .from('agents')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      return newRecord;
    },
    onSuccess: (newRecord, agentType) => {
      // Update cache with new agent
      const agentConfig: AgentConfig = {
        id: newRecord.id,
        name: newRecord.name,
        type: newRecord.type as AgentConfig['type'],
        intent: newRecord.intent,
        status: newRecord.operational_status as 'online' | 'offline' | 'processing',
        version: newRecord.version,
        createdAt: new Date(newRecord.created_at),
        lastModified: new Date(newRecord.last_modified),
        assistantId: newRecord.assistant_id || undefined,
        instructions: newRecord.instructions,
        whatChanged: newRecord.what_changed || undefined,
        versionNumber: newRecord.version_number,
        isLatest: newRecord.is_latest,
        parentAgentId: newRecord.parent_agent_id || undefined,
        modelSettings: {
          model: newRecord.model,
          maxCompletionTokens: newRecord.max_completion_tokens,
          topP: newRecord.top_p,
        },
      };
      
      queryClient.setQueryData(['agent', user?.id, agentType], agentConfig);

      toast({
        title: "Success",
        description: `${newRecord.name} created successfully`,
      });
    },
    onError: (error) => {
      console.error('Error creating agent:', error);
      toast({
        title: "Error", 
        description: "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  return { createAgent: createAgentMutation.mutateAsync, isCreating: createAgentMutation.isPending };
};