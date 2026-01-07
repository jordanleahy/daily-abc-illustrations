import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { BOOK_TYPE_TO_AGENT_TYPE } from '../_shared/types.ts';
import { fetchGradeLevels, getGradeLabel, type ValidGrade } from '../_shared/gradeLevels.ts';
import { buildCharacterConstraints } from '../_shared/characterConstraints.ts';
import { getWordsForDigraphThroughGrade, isValidDigraph, type GradeLevel } from '../_shared/digraphCorpus.ts';
import { getSeasonDisplay, isValidSeason, type ValidSeason } from '../_shared/seasons.ts';
import { getEnvironmentDisplay, isValidEnvironment, type ValidEnvironment } from '../_shared/environments.ts';
import { getClothingBrandDisplay, getClothingBrandPromptInjection, isValidClothingBrand, type ValidClothingBrand } from '../_shared/clothingBrands.ts';
import { getLocationDisplay, getLocationSpellingGuide, getResortVisualPrompt, isValidLocation, type ValidLocation } from '../_shared/locations.ts';
import { getCityDisplay, getCityVisualPrompt, isValidCity, type ValidCity } from '../_shared/cities.ts';

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
  gradeId?: string;
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
    const { messages, outlineReady, bookCreated, gradeLevel, bookType, characterTheme, selectedCharacterIds, season, environment, clothingBrand, location, city } = await req.json() as { 
      messages: Message[];
      outlineReady?: boolean;
      bookCreated?: boolean;
      gradeLevel?: ValidGrade;
      bookType?: string;
      characterTheme?: string;
      selectedCharacterIds?: string[];
      season?: ValidSeason;
      environment?: ValidEnvironment;
      clothingBrand?: ValidClothingBrand;
      location?: ValidLocation;
      city?: ValidCity;
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

    if (bookType) {
      // Book type selected - route to specialized agent
      const agentType = BOOK_TYPE_TO_AGENT_TYPE[bookType] || 'book-creation';
      console.log(`📚 Book type: ${bookType} → Agent: ${agentType}`);
      
      // Query database for specialized agent
      const { data: agent } = await supabase
        .from('agents')
        .select('instructions, name')
        .eq('type', agentType)
        .eq('is_latest', true)
        .single();
      
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

    // Add context about grade level if already provided
    const gradeContext = gradeLevel 
      ? `\n\n⚠️ CRITICAL - GRADE STATUS:\n📚 GRADE ALREADY SELECTED: ${getGradeLabel(gradeLevel)}\n❌ DO NOT ask "What grade level?" - Step 2 is COMPLETE.\n✅ PROCEED to the next step in the flow.\nTailor all educational content, vocabulary, and complexity to ${getGradeLabel(gradeLevel)}.`
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

    // Digraph-specific word corpus context - inject grade-filtered words when digraph book type
    let digraphWordsContext = '';
    if (bookType === 'digraph' && gradeLevel) {
      // Map gradeLevel (ValidGrade) to corpus GradeLevel
      const gradeMapping: Record<ValidGrade, GradeLevel> = {
        'PRE_K': 'PRE_K',
        'K': 'K',
        'GRADE_1': 'GRADE_1',
        'GRADE_2': 'GRADE_2'
      };
      const corpusGrade = gradeMapping[gradeLevel];
      
      if (corpusGrade) {
        // Try to detect which digraph was selected from conversation
        const digraphPatterns = ['ch', 'sh', 'th', 'wh', 'ph', 'ck', 'ng', 'gh', 'kn', 'wr', 'qu', 'tch', 'dge', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw'];
        let selectedDigraph: string | null = null;
        
        for (const msg of messages) {
          if (msg.role === 'user' && typeof msg.content === 'string') {
            const content = msg.content.toLowerCase();
            for (const dg of digraphPatterns) {
              // Look for digraph selection patterns like "ch" or "'ch'" or "the ch digraph"
              if (content.includes(`"${dg}"`) || content.includes(`'${dg}'`) || 
                  content.includes(`${dg} digraph`) || content.includes(`${dg} blend`) ||
                  content === dg || content.endsWith(` ${dg}`) || content.startsWith(`${dg} `)) {
                selectedDigraph = dg;
                break;
              }
            }
            if (selectedDigraph) break;
          }
        }
        
        if (selectedDigraph && isValidDigraph(selectedDigraph)) {
          const words = getWordsForDigraphThroughGrade(selectedDigraph, corpusGrade);
          if (words.length > 0) {
            const wordList = words.map(w => `- ${w.word} (${w.grade})`).join('\n');
            digraphWordsContext = `\n\n📖 GRADE-APPROPRIATE WORDS FOR "${selectedDigraph.toUpperCase()}" (up to ${getGradeLabel(gradeLevel)}):\n⚠️ CRITICAL: You MUST ONLY use words from this list for the book outline. Do NOT invent or suggest words outside this curated list.\n${wordList}`;
            console.log(`📚 Digraph corpus: Injected ${words.length} words for "${selectedDigraph}" up to ${gradeLevel}`);
          }
        }
      }
    }

    const themeContext = characterTheme
      ? characterTheme === 'custom'
        ? `\n\n⚠️ CRITICAL - THEME STATUS:\n🎨 CUSTOM THEME REQUESTED - The user wants a custom character theme but hasn't specified it yet. Ask them: "What character, style, or theme would you like? (e.g., dinosaurs, unicorns, superheroes, ocean animals)" Once they provide their custom theme, integrate it throughout the book outline.\n\n❌ DO NOT ask "What character theme would you like?" - this step is complete.`
        : characterTheme === 'no-theme'
        ? `\n\n⚠️ CRITICAL - THEME STATUS:\n📚 NO THEME - The user prefers an educational-only book without character themes. Focus purely on educational content with classic, simple illustrations. Do NOT integrate any character themes.\n\n❌ DO NOT ask about character themes - this step is complete. Proceed to grade level.`
        : `\n\n⚠️ CRITICAL - THEME STATUS:\n🎨 THEME ALREADY SELECTED: "${characterTheme}"\n❌ DO NOT ask "What character theme would you like?" - Step 1 is COMPLETE.\n✅ PROCEED to Step 2 (Grade Level) or Step 3 if grade is also set.\nIntegrate "${characterTheme}" character throughout the book outline including cover page, educational focus page, and all content pages.`
      : '';

    // Character constraints for selected characters - now fetched from database
    let characterConstraintsContext = '';
    console.log(`🎭 Character selection received:`, { characterTheme, selectedCharacterIds });
    if (selectedCharacterIds && selectedCharacterIds.length > 0 && characterTheme) {
      const constraints = await buildCharacterConstraints(supabase, characterTheme, selectedCharacterIds);
      if (constraints) {
        characterConstraintsContext = `\n\n${constraints}`;
        console.log(`🎭 Character constraints applied for ${characterTheme}:`, selectedCharacterIds);
      }
    }

    // Season context - optional discovery question
    const seasonContext = season && isValidSeason(season)
      ? `\n\n⚠️ CRITICAL - SEASON STATUS:\n🗓️ SEASON ALREADY SELECTED: ${getSeasonDisplay(season)}\n❌ DO NOT ask "What season?" - this step is COMPLETE.\nIntegrate ${getSeasonDisplay(season)} seasonal elements, colors, activities, and atmosphere throughout the book's illustrations and content.`
      : '';

    // Environment context - optional discovery question
    const environmentContext = environment && isValidEnvironment(environment)
      ? `\n\n⚠️ CRITICAL - ENVIRONMENT STATUS:\n🌍 ENVIRONMENT ALREADY SELECTED: ${getEnvironmentDisplay(environment)}\n❌ DO NOT ask "What environment/setting?" - this step is COMPLETE.\nSet all illustrations and content in a ${getEnvironmentDisplay(environment)} environment with appropriate scenery, landmarks, and atmosphere.`
      : '';

    // Clothing brand context - optional discovery question for character attire
    const clothingBrandContext = clothingBrand && isValidClothingBrand(clothingBrand)
      ? `\n\n⚠️ CRITICAL - CLOTHING BRAND STATUS:\n👕 CLOTHING BRAND ALREADY SELECTED: ${getClothingBrandDisplay(clothingBrand)}\n❌ DO NOT ask "What clothing brand?" - this step is COMPLETE.\n${getClothingBrandPromptInjection(clothingBrand)}`
      : '';

    // Location context - optional discovery question for specific resort
    const spellingGuide = location && isValidLocation(location) ? getLocationSpellingGuide(location) : null;
    const visualPrompt = location && isValidLocation(location) ? getResortVisualPrompt(location) : null;
    const locationContext = location && isValidLocation(location)
      ? `\n\n⚠️ CRITICAL - LOCATION STATUS:\n📍 LOCATION ALREADY SELECTED: ${getLocationDisplay(location)}${spellingGuide ? `\n📝 ${spellingGuide}` : ''}\n❌ DO NOT ask "Which resort/location?" - this step is COMPLETE.${visualPrompt || ''}`
      : '';

    // City context - optional discovery question for urban setting (asked after resort)
    const cityVisualPrompt = city && isValidCity(city) ? getCityVisualPrompt(city) : null;
    const cityContext = city && isValidCity(city)
      ? `\n\n⚠️ CRITICAL - CITY STATUS:\n🏙️ CITY ALREADY SELECTED: ${getCityDisplay(city)}\n❌ DO NOT ask "Which city?" - this step is COMPLETE.${cityVisualPrompt || ''}`
      : '';

    // Check if user is forcing outline creation (e.g., typing "create outline")
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const lastMessageContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content.toLowerCase() : '';
    const forceOutline = lastMessageContent.includes('create outline') || lastMessageContent.includes('generate outline');

    // Location question injection - ask BEFORE city question (optional questions come before title)
    // Only inject if: no location selected yet, outline not ready, book not created, not forcing outline
    const shouldAskLocationQuestion = !location && !outlineReady && !bookCreated && !forceOutline;

    // City question injection - ask AFTER location question, BEFORE title confirmation
    // Only inject if: location is answered/skipped, no city selected yet, outline not ready, book not created
    const shouldAskCityQuestion = (location || lastMessageContent.includes('skip')) && !city && !outlineReady && !bookCreated && !forceOutline;

    // Detect if user just approved title (clicked "Looks perfect, create the outline!" or similar)
    const titleApprovalPhrases = ['looks perfect', 'create the outline', 'create outline', 'looks great', 'perfect!', 'approved', 'let\'s create'];
    const titleWasJustApproved = titleApprovalPhrases.some(phrase => lastMessageContent.includes(phrase));

    // Location question injection - shown BEFORE title proposal (optional questions come before title)
    // This ensures title confirmation is the VERY LAST step before outline generation
    const locationQuestionInjection = shouldAskLocationQuestion
      ? `\n\n📍 OPTIONAL QUESTION - LOCATION (Ask BEFORE proposing title):
Before proposing the book title, ask this optional question:

"Would you like to set this book at a specific resort? This is optional."

[SUGGEST]
VAIL_RESORT: 🏔️ Vail Resort
SUGARBUSH_RESORT: 🍁 Sugarbush Resort
STRATTON: ⛷️ Stratton
KILLINGTON: 🏂 Killington Mountain
MOUNTAIN_CREEK: 🎿 Mountain Creek
COPPER_MOUNTAIN: 🥉 Copper Mountain
BRECKENRIDGE: 🏘️ Breckenridge
KEYSTONE: 🌙 Keystone
skip-location: ⏭️ Skip (no specific resort)
[/SUGGEST]

⚠️ CRITICAL FLOW ORDER: All optional questions (location, city, season, environment, etc.) MUST be asked BEFORE proposing the book title. The title confirmation ("Looks great!") should be the VERY LAST step before generating the outline.`
      : '';

    // City question injection - shown AFTER location, BEFORE title proposal
    const cityQuestionInjection = shouldAskCityQuestion
      ? `\n\n🏙️ OPTIONAL QUESTION - CITY (Ask AFTER location, BEFORE proposing title):
Ask this optional question:

"Would you like to set this book in a specific city? This is optional."

[SUGGEST]
JERSEY_CITY: 🌅 Jersey City
HOBOKEN: 🚂 Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]

⚠️ CRITICAL: Ask this AFTER the resort location question and BEFORE proposing the book title.`
      : '';

    // Check if all optional questions are complete - if so, prompt agent to propose title
    const allOptionalQuestionsComplete = (season || lastMessageContent.includes('skip')) && 
                                          (environment || lastMessageContent.includes('skip')) && 
                                          (clothingBrand || lastMessageContent.includes('skip') || lastMessageContent.includes('burton') || lastMessageContent.includes('no brand')) && 
                                          (location || lastMessageContent.includes('skip') || lastMessageContent.includes('resort') || lastMessageContent.includes('killington') || lastMessageContent.includes('vail') || lastMessageContent.includes('stratton')) &&
                                          (city || lastMessageContent.includes('skip') || lastMessageContent.includes('jersey') || lastMessageContent.includes('hoboken') || lastMessageContent.includes('new york'));
    
    // Proceed to title context - when all optional questions are answered, prompt title proposal
    const proceedToTitleContext = allOptionalQuestionsComplete && !outlineReady && !bookCreated && !titleWasJustApproved
      ? `\n\n✅ ALL OPTIONAL QUESTIONS COMPLETE: Season, environment, clothing brand, and location have all been answered or skipped. NOW proceed to propose a book title and description for user approval. Do NOT ask any more optional questions.`
      : '';

    // Title confirmation is the FINAL step - when title is approved, generate outline immediately
    const titleConfirmationContext = titleWasJustApproved
      ? `\n\n✅ TITLE CONFIRMED - GENERATE OUTLINE NOW: The user has approved the title. All discovery and optional questions are complete. Generate the complete book outline immediately with all pages, titles, and image prompts.`
      : '';

    const conversationStageContext = outlineReady
      ? '\n\n✅ OUTLINE COMPLETE: The book outline has been created and approved. Focus conversation on next steps: reviewing pages, creating the book, or making adjustments.'
      : bookCreated
      ? '\n\n📖 BOOK CREATED: The book has been successfully created in the database. User can now review pages, generate images, or make edits.'
      : forceOutline
      ? '\n\n🚀 FORCE OUTLINE: The user has requested immediate outline generation. Generate the complete book outline NOW with all pages, titles, and image prompts in markdown format. Do not ask any more discovery questions. Use sensible defaults for any missing information (age: 3-4 years, letter case: lowercase for ABC, etc.). Generate the full outline in this response with empty suggestions array.'
      : '\n\n🎯 DISCOVERY PHASE: Guide the user through the book creation conversation to gather all requirements for generating a complete outline.';

    // Multi-language support - respond in user's language while maintaining safety
    const languageContext = `\n\n🌍 LANGUAGE INSTRUCTION: Detect the language the user is writing in and respond in that SAME language throughout the entire conversation. This applies to all responses including discovery questions, suggestions, title/description proposals, and the complete book outline. Maintain all content safety guidelines and age-appropriateness regardless of language. Do NOT translate internal instruction tags like [SUGGEST] or markdown formatting.`;

    // Combine base prompt with contextual additions
    const systemMessage: Message = {
      role: 'system',
      content: systemPromptContent + languageContext + gradeContext + curatedItemsContext + digraphWordsContext + themeContext + characterConstraintsContext + seasonContext + environmentContext + clothingBrandContext + locationContext + cityContext + locationQuestionInjection + cityQuestionInjection + proceedToTitleContext + titleConfirmationContext + conversationStageContext,
    };

    console.log(`🤖 Agent source: ${agentSource}`);
    console.log(`📊 System prompt length: ${systemMessage.content.length} characters`);
    console.log(`📊 Conversation stage: ${outlineReady ? 'Outline Ready' : bookCreated ? 'Book Created' : 'Discovery'}`);
    console.log(`📚 Grade level: ${gradeLevel || 'None'}`);
    console.log(`🎨 Character theme: ${characterTheme || 'None'}`);
    console.log(`🗓️ Season: ${season || 'None'}`);
    console.log(`🌍 Environment: ${environment || 'None'}`);
    console.log(`👕 Clothing brand: ${clothingBrand || 'None'}`);
    console.log(`📍 Location: ${location || 'None'}`);
    console.log(`🏙️ City: ${city || 'None'}`);
    console.log(`✅ All optional questions complete: ${allOptionalQuestionsComplete}`);
    console.log(`📝 Proceed to title: ${proceedToTitleContext ? 'Yes' : 'No'}`);
    console.log(`🎯 Title approved: ${titleWasJustApproved}`);

    const allMessages = [systemMessage, ...messages];

    console.log('Calling Lovable AI with', allMessages.length, 'messages');

    // Call Lovable AI Gateway with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: allMessages,
        stream: true,
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

    console.log('Lovable AI streaming response started');

    // Return the stream directly with proper headers
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

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
