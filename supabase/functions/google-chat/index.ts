import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { BOOK_TYPE_TO_AGENT_TYPE } from '../_shared/types.ts';
import { transformToSuggestBlock, validateStructuredResponse } from '../_shared/responseTransformer.ts';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface SuggestedAction {
  id: string;
  label: string;
  value: string;
  themeId?: string;
  ageRangeId?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

// Curated ABC items for themed books
const ABC_CURATED_ITEMS: Record<string, Record<string, string[]>> = {
  'animals': {
    A: ['Alligator', 'Ant', 'Anteater'], B: ['Bear', 'Butterfly', 'Bee'], C: ['Cat', 'Cow', 'Caterpillar'],
    D: ['Dog', 'Duck', 'Dolphin'], E: ['Elephant', 'Eagle', 'Emu'], F: ['Fox', 'Frog', 'Fish'],
    G: ['Giraffe', 'Gorilla', 'Goat'], H: ['Horse', 'Hippo', 'Hedgehog'], I: ['Iguana', 'Ibis'],
    J: ['Jaguar', 'Jellyfish'], K: ['Kangaroo', 'Koala', 'Kiwi'], L: ['Lion', 'Llama', 'Leopard'],
    M: ['Monkey', 'Mouse', 'Moose'], N: ['Newt', 'Narwhal'], O: ['Owl', 'Octopus', 'Otter'],
    P: ['Penguin', 'Pig', 'Panda'], Q: ['Quail', 'Queen Bee'], R: ['Rabbit', 'Raccoon', 'Rhinoceros'],
    S: ['Snake', 'Squirrel', 'Seal'], T: ['Tiger', 'Turtle', 'Turkey'], U: ['Urchin', 'Umbrellabird'],
    V: ['Vulture', 'Viper'], W: ['Wolf', 'Whale', 'Walrus'], X: ['X-ray Fish', 'Xenops'],
    Y: ['Yak', 'Yellow Jacket'], Z: ['Zebra', 'Zebu']
  },
  'food': {
    A: ['Apple', 'Avocado', 'Apricot'], B: ['Banana', 'Bread', 'Broccoli'], C: ['Carrot', 'Cookie', 'Corn'],
    D: ['Donut', 'Date', 'Dragon Fruit'], E: ['Egg', 'Eggplant'], F: ['Fish', 'Fries', 'Fig'],
    G: ['Grapes', 'Grapefruit', 'Guava'], H: ['Hot Dog', 'Honey', 'Ham'], I: ['Ice Cream', 'Ice Pop'],
    J: ['Juice', 'Jam', 'Jellybean'], K: ['Kiwi', 'Kale'], L: ['Lemon', 'Lettuce', 'Lollipop'],
    M: ['Milk', 'Muffin', 'Mango'], N: ['Noodles', 'Nut', 'Nectarine'], O: ['Orange', 'Olive', 'Oatmeal'],
    P: ['Pizza', 'Pear', 'Popcorn'], Q: ['Quiche', 'Quinoa'], R: ['Rice', 'Raisin', 'Radish'],
    S: ['Strawberry', 'Sandwich', 'Soup'], T: ['Tomato', 'Toast', 'Taco'], U: ['Udon', 'Upside-down Cake'],
    V: ['Vegetable', 'Vanilla'], W: ['Watermelon', 'Waffle', 'Walnut'], X: ['Xigua'],
    Y: ['Yogurt', 'Yam'], Z: ['Zucchini', 'Ziti']
  },
  'nature': {
    A: ['Acorn', 'Acacia Tree'], B: ['Butterfly', 'Branch', 'Brook'], C: ['Cloud', 'Creek', 'Clover'],
    D: ['Dandelion', 'Dew', 'Daisy'], E: ['Earth', 'Evergreen'], F: ['Flower', 'Fern', 'Forest'],
    G: ['Grass', 'Garden', 'Grove'], H: ['Hill', 'Honeybee', 'Hive'], I: ['Ivy', 'Island'],
    J: ['Jungle', 'Jay'], K: ['Kelp', 'Kite'], L: ['Leaf', 'Lake', 'Lightning'],
    M: ['Mountain', 'Moon', 'Meadow'], N: ['Nest', 'Night Sky'], O: ['Ocean', 'Oak Tree', 'Orchid'],
    P: ['Pine Tree', 'Pebble', 'Pond'], Q: ['Quartz', 'Quiet Stream'], R: ['River', 'Rock', 'Rainbow'],
    S: ['Sun', 'Stone', 'Stream'], T: ['Tree', 'Thunder', 'Tide'], U: ['Umbrella Leaf'],
    V: ['Valley', 'Vine', 'Volcano'], W: ['Waterfall', 'Wind', 'Willow'], X: ['Xerophyte'],
    Y: ['Yew Tree', 'Yellow Flower'], Z: ['Zinnia', 'Zen Garden']
  },
  'vehicles': {
    A: ['Airplane', 'Ambulance', 'ATV'], B: ['Bus', 'Boat', 'Bicycle'], C: ['Car', 'Crane', 'Cement Truck'],
    D: ['Dump Truck', 'Digger'], E: ['Excavator', 'Engine'], F: ['Fire Truck', 'Ferry', 'Fork Lift'],
    G: ['Garbage Truck', 'Go-Kart'], H: ['Helicopter', 'Hot Air Balloon', 'Hovercraft'], I: ['Ice Cream Truck'],
    J: ['Jet', 'Jeep'], K: ['Kayak', 'Kite'], L: ['Limousine', 'Loader'],
    M: ['Motorcycle', 'Monster Truck'], N: ['NASCAR', 'Navy Ship'], O: ['Oil Tanker'],
    P: ['Police Car', 'Plane', 'Pickup Truck'], Q: ['Quad Bike'], R: ['Race Car', 'Rocket', 'Rowboat'],
    S: ['Submarine', 'Scooter', 'Sailboat'], T: ['Train', 'Tractor', 'Taxi'], U: ['Unicycle', 'Utility Truck'],
    V: ['Van', 'Vespa'], W: ['Wagon', 'Water Ski'], X: ['X-15'], Y: ['Yacht', 'Yellow Bus'],
    Z: ['Zamboni', 'Zeppelin']
  },
  'mixed': {
    A: ['Apple', 'Alligator', 'Airplane'], B: ['Ball', 'Bear', 'Boat'], C: ['Cat', 'Car', 'Cookie'],
    D: ['Dog', 'Drum', 'Door'], E: ['Elephant', 'Egg', 'Ear'], F: ['Fish', 'Flower', 'Fire Truck'],
    G: ['Goat', 'Grapes', 'Guitar'], H: ['Horse', 'Hat', 'House'], I: ['Ice Cream', 'Iguana', 'Igloo'],
    J: ['Jump Rope', 'Jellyfish', 'Juice'], K: ['Kite', 'Kangaroo', 'Key'], L: ['Lion', 'Leaf', 'Lemon'],
    M: ['Moon', 'Monkey', 'Milk'], N: ['Nest', 'Nose', 'Nut'], O: ['Octopus', 'Orange', 'Owl'],
    P: ['Pig', 'Pizza', 'Penguin'], Q: ['Queen', 'Quilt', 'Question Mark'], R: ['Rainbow', 'Rabbit', 'Ring'],
    S: ['Sun', 'Snake', 'Star'], T: ['Tiger', 'Tree', 'Turtle'], U: ['Umbrella', 'Unicorn'],
    V: ['Volcano', 'Violin', 'Vest'], W: ['Whale', 'Watermelon', 'Watch'], X: ['Xylophone', 'X-ray'],
    Y: ['Yo-yo', 'Yak', 'Yarn'], Z: ['Zebra', 'Zipper', 'Zoo']
  },
  'mountain-village': {
    A: ['Apron', 'Alpine Cottage', 'Axe'], B: ['Bakery', 'Bridge', 'Barn'],
    C: ['Church', 'Cottage', 'Café'], D: ['Door', 'Dog', 'Dairy'], E: ['Evergreen Tree', 'Entrance Gate'],
    F: ['Fountain', 'Fence', 'Flower Box'], G: ['Garden', 'Goat', 'Gate'], H: ['House', 'Hill', 'Horse'],
    I: ['Inn', 'Icicle'], J: ['Jug', 'Junction'], K: ['Kitchen', 'Kettle'], L: ['Lodge', 'Ladder', 'Lantern'],
    M: ['Mill', 'Market', 'Mountain'], N: ['Nest', 'Narrow Path'], O: ['Oven', 'Old Oak'],
    P: ['Path', 'Post Office', 'Porch'], Q: ['Quilt', 'Quiet Square'], R: ['Roof', 'River', 'Railing'],
    S: ['School', 'Stone Wall', 'Shop'], T: ['Tower', 'Tavern', 'Terrace'], U: ['Umbrella', 'Upstairs Window'],
    V: ['Village Square', 'Vegetable Garden', 'Valley View'], W: ['Well', 'Window Box', 'Wheelbarrow'],
    X: ['X-Crossing'], Y: ['Yard', 'Yellow Door'], Z: ['Zigzag Roofline', 'Zone']
  },
  'snowboarding': {
    A: ['Aerial', 'Air', 'Alley-Oop'], B: ['Board', 'Backside', 'Binding'], C: ['Carve', 'Chairlift', 'Cornice'],
    D: ['Drop', 'Deck', 'Downhill'], E: ['Edge', 'Eject'], F: ['Freestyle', 'Fakie', 'Fifty-Fifty'],
    G: ['Grab', 'Goofy', 'Grind'], H: ['Halfpipe', 'Heel Edge', 'High Five'], I: ['Indy Grab', 'Invert'],
    J: ['Jump', 'Jib', 'Japan Grab'], K: ['Kicker', 'Knuckle'], L: ['Landing', 'Lift', 'Lip'],
    M: ['Method', 'Mute Grab', 'Mountain'], N: ['Nose Grab', 'Nollie'], O: ['Ollie', 'Off-Axis'],
    P: ['Park', 'Powder', 'Pipe'], Q: ['Quarter Pipe'], R: ['Rail', 'Run', 'Regular'],
    S: ['Slope', 'Spin', 'Stomp'], T: ['Terrain Park', 'Toe Edge', 'Tail'], U: ['Underflip', 'Uphill'],
    V: ['Vert', 'Vitelli Flip'], W: ['Wipe Out', 'Wildcat', 'Wall Ride'], X: ['X-Games'],
    Y: ['Yard Sale', 'Yawning'], Z: ['Zeach', 'Zone']
  }
};

function getCuratedItemsList(themeKey: string): string {
  const items = ABC_CURATED_ITEMS[themeKey];
  if (!items) return '';
  return Object.entries(items)
    .map(([letter, options]) => `${letter}: ${options.join(' / ')}`)
    .join('\n');
}

// Optional parser for AI suggestions
function parseSuggestions(aiResponse: string): { 
  cleanContent: string; 
  suggestedActions?: SuggestedAction[] 
} {
  const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
  const match = aiResponse.match(suggestRegex);
  
  if (!match) {
    return { cleanContent: aiResponse };
  }
  
  const suggestionsText = match[1].trim();
  const cleanContent = aiResponse.replace(suggestRegex, '').trim();

  const suggestedActions = suggestionsText
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return null;
      
      const id = line.substring(0, colonIndex).trim();
      const label = line.substring(colonIndex + 1).trim();
      
      // Simple ID-based detection (no complex validation needed)
      return {
        id,
        label,
        value: id === 'custom' ? '' : `${label}`
      };
    })
    .filter((action): action is SuggestedAction => action !== null);
  
  return { cleanContent, suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, outlineReady, bookCreated, kidAge, bookType, characterTheme } = await req.json() as { 
      messages: Message[];
      outlineReady?: boolean;
      bookCreated?: boolean;
      kidAge?: { years: number; months: number };
      bookType?: string;
      characterTheme?: string;
    };

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

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which agent and system prompt to use
    let systemPromptContent: string;
    let agentSource: string;
    let agent: any = null; // Declare agent at function scope

    if (bookType) {
      // Book type selected - route to specialized agent
      const agentType = BOOK_TYPE_TO_AGENT_TYPE[bookType] || 'book-creation';
      console.log(`📚 Book type: ${bookType} → Agent: ${agentType}`);
      
      // Query database for specialized agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('instructions, name, max_completion_tokens')
        .eq('type', agentType)
        .eq('is_latest', true)
        .single();
      
      agent = agentData; // Assign to function-scope variable
      
      if (agent?.instructions) {
        systemPromptContent = agent.instructions;
        agentSource = `Database: ${agent.name}`;
        console.log(`✅ Using ${agent.name} (${agent.instructions.length} chars)`);
      } else {
        // Fallback for no book type selected
        systemPromptContent = `You are a helpful AI assistant for creating children's educational books. Help users explore different book types: ABC, Numbers, Colors, Shapes, Animals, Rhyming, Emotions, Opposites, First Words, CVC Words, Sight Words, and Bedtime stories. Ask which type interests them.`;
        agentSource = 'Inline: Discovery';
        console.log('⚠️ Using inline discovery prompt');
      }
    } else {
      // No book type - minimal discovery prompt
      systemPromptContent = `You are a helpful AI assistant for creating children's educational books. Help users explore different book types: ABC, Numbers, Colors, Shapes, Animals, Rhyming, Emotions, Opposites, First Words, CVC Words, Sight Words, and Bedtime stories. Ask which type interests them.`;
      agentSource = 'Inline: Discovery';
      console.log('🔍 No book type selected');
    }

    // Add context about kid age and theme if already provided
    const ageContext = kidAge 
      ? `\n\n👶 CHILD AGE CONTEXT:\nThe selected child is ${kidAge.years} years and ${kidAge.months} months old. Skip the age discovery question and use this age to tailor all educational content, vocabulary, and complexity to this specific developmental stage.`
      : '';

    // ABC-specific curated items context - only process if ABC book and subject theme selected
    let curatedItemsContext = '';
    if (bookType === 'abc') {
      const subjectTheme = messages.find(m => 
        m.role === 'user' && 
        typeof m.content === 'string' && 
        (m.content.includes('Animals A-Z') || 
         m.content.includes('Food & Fruits A-Z') ||
         m.content.includes('Nature A-Z') ||
         m.content.includes('Things That Go A-Z') ||
         m.content.includes('Classic Mixed Objects') ||
         m.content.includes('Mountain Village A-Z') ||
         m.content.includes('Snowboarding A-Z'))
      );
      
      if (subjectTheme) {
        const themeMapping: Record<string, string> = {
          'Animals A-Z': 'animals',
          'Food & Fruits A-Z': 'food',
          'Nature A-Z': 'nature',
          'Things That Go A-Z': 'vehicles',
          'Classic Mixed Objects': 'mixed',
          'Mountain Village A-Z': 'mountain-village',
          'Snowboarding A-Z': 'snowboarding'
        };
        
        const matchedTheme = Object.keys(themeMapping).find(key => 
          typeof subjectTheme.content === 'string' && subjectTheme.content.includes(key)
        );
        
        if (matchedTheme) {
          const themeKey = themeMapping[matchedTheme];
          curatedItemsContext = `\n\n📋 CURATED ITEMS REFERENCE (Select from these options):\n${getCuratedItemsList(themeKey)}`;
        }
      }
    }

    const themeContext = characterTheme
      ? characterTheme === 'custom'
        ? `\n\n🎨 CUSTOM THEME REQUESTED:\nThe user wants a custom character theme but hasn't specified it yet. Ask them: "What character, style, or theme would you like? (e.g., dinosaurs, unicorns, superheroes, ocean animals)" Once they provide their custom theme, integrate it throughout the book outline.`
        : characterTheme === 'no-theme'
        ? `\n\n📚 NO THEME SELECTED:\nThe user prefers an educational-only book without character themes. Skip the theme discovery question. Focus purely on educational content with classic, simple illustrations. Do NOT integrate any character themes.`
        : `\n\n🎨 CHARACTER THEME SELECTED:\nThe user has selected "${characterTheme}" as the character theme. Skip the theme discovery question and integrate this character throughout the book outline including cover page, educational focus page, and all content pages. Make specific references to the character in image descriptions.`
      : '';

    const conversationStageContext = outlineReady
      ? '\n\n✅ OUTLINE COMPLETE: The book outline has been created and approved. Focus conversation on next steps: reviewing pages, creating the book, or making adjustments.'
      : bookCreated
      ? '\n\n📖 BOOK CREATED: The book has been successfully created in the database. User can now review pages, generate images, or make edits.'
      : '\n\n🎯 DISCOVERY PHASE: Guide the user through the book creation conversation to gather all requirements for generating a complete outline.';

    // Combine base prompt with contextual additions
    const systemMessage: Message = {
      role: 'system',
      content: systemPromptContent + ageContext + curatedItemsContext + themeContext + conversationStageContext,
    };

    console.log(`🤖 Agent source: ${agentSource}`);
    console.log(`📊 System prompt length: ${systemMessage.content.length} characters`);
    console.log(`📊 Conversation stage: ${outlineReady ? 'Outline Ready' : bookCreated ? 'Book Created' : 'Discovery'}`);
    console.log(`👶 Kid age provided: ${kidAge ? `${kidAge.years}y ${kidAge.months}m` : 'No'}`);
    console.log(`🎨 Character theme: ${characterTheme || 'None'}`);

    const allMessages = [systemMessage, ...messages];

    const maxTokens = agent?.max_completion_tokens || 8000;
    console.log('Calling Lovable AI with', allMessages.length, 'messages');
    console.log('📊 Max tokens:', maxTokens);

    // Call Lovable AI Gateway with structured output enabled (non-streaming)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: allMessages,
        max_tokens: maxTokens,
        stream: false, // Must be false for structured output
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "agent_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The conversational message to display to the user"
                },
                suggestions: {
                  type: "array",
                  description: "Optional array of clickable button suggestions. Empty array for open-ended questions.",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Machine-readable identifier (e.g., 'paw-patrol', 'lowercase', 'approve')"
                      },
                      label: {
                        type: "string",
                        description: "Human-readable display text (e.g., 'Paw Patrol', 'lowercase letters', 'Looks perfect!')"
                      }
                    },
                    required: ["id", "label"],
                    additionalProperties: false
                  }
                },
                metadata: {
                  type: "object",
                  description: "Optional metadata about the current conversation step",
                  properties: {
                    confirmedPageCount: {
                      type: "number",
                      description: "The confirmed/recommended page count for the book"
                    },
                    currentStep: {
                      type: "string",
                      description: "Current step in the conversation flow (e.g., 'page-count-confirmation')"
                    }
                  },
                  required: [],
                  additionalProperties: false
                }
              },
              required: ["message", "suggestions"],
              additionalProperties: false
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lovable AI response received');

    // Parse the structured JSON response
    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate the structured response
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Invalid response format from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateStructuredResponse(structuredResponse)) {
      console.error('Invalid structured response schema:', structuredResponse);
      return new Response(
        JSON.stringify({ error: 'Invalid response schema from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform structured JSON to [SUGGEST] block format
    const transformedContent = transformToSuggestBlock(structuredResponse);
    console.log('Transformed response:', transformedContent);

    // Return the transformed text response with metadata
    return new Response(
      JSON.stringify({ 
        content: transformedContent,
        role: 'assistant',
        metadata: structuredResponse.metadata || null
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
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
