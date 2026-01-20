import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { BOOK_TYPE_TO_AGENT_TYPE, getBookTypeCategoryWord, normalizeBookType } from '../_shared/types.ts';
import { fetchGradeLevels, getGradeLabel, type ValidGrade } from '../_shared/gradeLevels.ts';
import { buildCharacterConstraints, fetchCharactersForTheme } from '../_shared/characterConstraints.ts';
import { getWordsForDigraphThroughGrade, isValidDigraph, type GradeLevel } from '../_shared/digraphCorpus.ts';
import { getWordsForLevel, getTopWordsForLevel, isValidSightWordLevel, getSightWordLevelLabel, type SightWordLevel } from '../_shared/sightWordsCorpus.ts';
import { getSeasonDisplay, isValidSeason, type ValidSeason } from '../_shared/seasons.ts';
import { getEnvironmentDisplay, isValidEnvironment, type ValidEnvironment } from '../_shared/environments.ts';
import { getMannersEnvironmentDisplay, isValidMannersEnvironment, getMannersEnvironmentSuggestBlock, type ValidMannersEnvironment } from '../_shared/mannersEnvironments.ts';
import { getClothingBrandDisplay, getClothingBrandPromptInjection, isValidClothingBrand, type ValidClothingBrand } from '../_shared/clothingBrands.ts';
import { getLocationDisplay, getLocationSpellingGuide, getResortVisualPrompt, isValidLocation, initLocationsCache, type ValidLocation } from '../_shared/locations.ts';
import { getCityDisplaySync, getCityVisualPromptSync, isValidCity, initCitiesCache, type ValidCity } from '../_shared/cities.ts';
import { getCuratedItemsList } from '../_shared/abcCuratedItems.ts';
// Dynamic question injection system - fetches enabled questions and injects [SUGGEST] blocks

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

interface StaticOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

interface QuestionDetails {
  id: string;
  label: string;
  description: string | null;
  static_options: StaticOption[] | null;
  placeholder_key: string | null;
  // Lookup-based question fields
  options_table: string | null;
  options_value_column: string | null;
  options_label_column: string | null;
}

interface EnabledQuestionWithDetails {
  question_id: string;
  sort_order: number;
  question: QuestionDetails;
  // Resolved options (from static_options OR fetched from lookup table)
  resolvedOptions?: StaticOption[];
}

/**
 * Extract which question IDs have been answered based on conversation history.
 * Checks if any user message contains an option ID or label from a question's resolved options.
 */
function extractAnsweredQuestions(
  messages: Message[],
  enabledQuestions: EnabledQuestionWithDetails[]
): Set<string> {
  const answered = new Set<string>();
  
  for (const eq of enabledQuestions) {
    const questionId = eq.question_id;
    // Use resolvedOptions (which includes both static and lookup-based options)
    const options = eq.resolvedOptions || eq.question.static_options || [];
    
    // Check if any user message contains an option ID or label from this question
    for (const msg of messages) {
      if (msg.role !== 'user') continue;
      const content = typeof msg.content === 'string' 
        ? msg.content.toLowerCase() 
        : '';
      
      for (const opt of options) {
        // Check for option ID (exact) or label (contains) in the message
        if (content.includes(opt.id.toLowerCase()) || 
            content.toLowerCase().includes(opt.label.toLowerCase())) {
          answered.add(questionId);
          break;
        }
      }
      
      // Also check for "skip-{questionId}" pattern
      if (content.includes(`skip-${questionId}`)) {
        answered.add(questionId);
      }
      
      if (answered.has(questionId)) break;
    }
  }
  
  return answered;
}

/**
 * Build a dynamic [SUGGEST] block for the next unanswered question.
 * Uses resolvedOptions which may come from static_options OR lookup tables.
 * Returns empty string if all questions are answered or no questions have options.
 */
function buildDynamicDiscoveryBlock(
  enabledQuestions: EnabledQuestionWithDetails[],
  answeredQuestionIds: Set<string>,
  existingContextKeys: Set<string>
): string {
  // Filter out already-answered questions and those already in context
  const unanswered = enabledQuestions.filter(eq => {
    // Skip if already answered in conversation
    if (answeredQuestionIds.has(eq.question_id)) return false;
    
    // Skip if already provided via explicit context (e.g., gradeLevel, season, etc.)
    // These are the question IDs that match context parameter names
    const contextKeyMappings: Record<string, string[]> = {
      'grade_level': ['gradeLevel', 'grade_level'],
      'character_theme': ['characterTheme', 'character_theme'],
      'season': ['season'],
      'environment': ['environment'],
      'clothing_brand': ['clothingBrand', 'clothing_brand'],
      'location': ['location'],
      'city': ['city'],
      'manner_type': ['mannerType', 'manner_type'],
      'manner_setting': ['mannersSetting', 'manner_setting', 'manners_setting'],
      'RESORT': ['location', 'resort'],
      'BRAND': ['clothingBrand', 'brand'],
      'age_group': ['ageGroup', 'age_group'],
    };
    
    const mappedKeys = contextKeyMappings[eq.question_id] || [];
    if (mappedKeys.some(key => existingContextKeys.has(key))) {
      return false;
    }
    
    return true;
  });
  
  if (unanswered.length === 0) return '';
  
  // Take the next unanswered question (sorted by sort_order)
  const nextQuestion = unanswered[0];
  const question = nextQuestion.question;
  
  // Use resolvedOptions (which includes both static and lookup-based options)
  const options = nextQuestion.resolvedOptions || question.static_options || [];
  
  // Skip questions without options (free text only)
  if (options.length === 0) {
    return '';
  }
  
  // Build [SUGGEST] block from resolved options
  const optionsText = options
    .map(opt => `${opt.id}: ${opt.emoji || ''} ${opt.label}${opt.description ? ` - ${opt.description}` : ''}`)
    .join('\n');
  
  return `

📋 DYNAMIC DISCOVERY QUESTION: ${question.label}
${question.description || ''}

⚠️ YOU MUST ASK THIS QUESTION NOW before proceeding to title/outline generation.
Ask the user: "${question.label}?" and present these options:

[SUGGEST]
${optionsText}
skip-${question.id}: ⏭️ Skip this question
[/SUGGEST]

⚠️ WAIT for user to select an option before proceeding to the next step.
`;
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
    const { messages, outlineReady, bookCreated, gradeLevel, bookType, characterTheme, selectedCharacterIds, season, environment, clothingBrand, location, city, mannerType, mannersSetting, discoveryContext } = await req.json() as { 
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
      mannerType?: string;
      mannersSetting?: string; // home, school, both, or skip-setting
      discoveryContext?: Record<string, string>; // Frontend-driven discovery answers
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

    // Initialize caches from database
    await initLocationsCache();
    await initCitiesCache(supabase);

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

    // Track enabled questions for this agent (will be populated if bookType is set)
    let enabledQuestions: Set<string> = new Set();
    let enabledQuestionsWithDetails: EnabledQuestionWithDetails[] = [];

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
      
      // Fetch enabled questions for this agent type WITH full question details (including lookup columns)
      const { data: agentQuestionsData } = await supabase
        .from('agent_questions')
        .select(`
          question_id,
          is_enabled,
          sort_order,
          question:questions(
            id, label, description, static_options, placeholder_key,
            options_table, options_value_column, options_label_column
          )
        `)
        .eq('agent_type', agentType)
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true });
      
      // Build set of enabled question IDs for backward compatibility
      const agentQuestions = agentQuestionsData || [];
      for (const aq of agentQuestions) {
        if (aq.is_enabled && aq.question) {
          enabledQuestions.add(aq.question_id);
        }
      }
      console.log(`📋 Enabled questions for ${agentType}:`, Array.from(enabledQuestions));
      
      // Store the full question details for dynamic injection
      // Also resolve lookup-based options from their tables
      enabledQuestionsWithDetails = [];
      
      for (const aq of agentQuestions) {
        if (!aq.question) continue;
        
        const question = aq.question as QuestionDetails;
        let resolvedOptions: StaticOption[] | undefined;
        
        // If question has static_options, use those
        if (question.static_options && question.static_options.length > 0) {
          resolvedOptions = question.static_options;
        } 
        // If question has lookup table config, fetch options from that table
        else if (question.options_table && question.options_value_column && question.options_label_column) {
          try {
            const { data: lookupData, error: lookupError } = await supabase
              .from(question.options_table)
              .select(`${question.options_value_column}, ${question.options_label_column}`)
              .limit(20);
            
            if (lookupError) {
              console.error(`❌ Error fetching options from ${question.options_table}:`, lookupError);
            } else if (lookupData && lookupData.length > 0) {
              resolvedOptions = lookupData.map((row: Record<string, unknown>) => ({
                id: String(row[question.options_value_column!]),
                label: String(row[question.options_label_column!]),
              }));
              console.log(`📋 Resolved ${resolvedOptions.length} options from ${question.options_table} for ${question.id}`);
            }
          } catch (err) {
            console.error(`❌ Exception fetching options from ${question.options_table}:`, err);
          }
        }
        
        enabledQuestionsWithDetails.push({
          question_id: aq.question_id,
          sort_order: aq.sort_order,
          question,
          resolvedOptions,
        });
      }
      
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

    // Add context about grade level if already provided (only if grade_level question is enabled)
    const isGradeLevelEnabled = enabledQuestions.has('grade_level');
    const gradeContext = gradeLevel && isGradeLevelEnabled
      ? `\n\n⚠️ CRITICAL - GRADE STATUS:\n📚 GRADE ALREADY SELECTED: ${getGradeLabel(gradeLevel)}\n❌ DO NOT ask "What grade level?" - Step 2 is COMPLETE.\n✅ PROCEED to the next step in the flow.\nTailor all educational content, vocabulary, and complexity to ${getGradeLabel(gradeLevel)}.`
      : !isGradeLevelEnabled
      ? `\n\n📋 GRADE LEVEL QUESTION DISABLED: Do NOT ask about grade level. Use age-appropriate content for general children's educational books.`
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

    // Sight Words-specific word corpus context - inject level-filtered words when sight-words book type
    let sightWordsContext = '';
    if (bookType === 'sight-words') {
      // Try to detect which word level was selected from conversation
      const levelPatterns: { pattern: RegExp; level: SightWordLevel }[] = [
        { pattern: /pre-?primer|pre_primer/i, level: 'pre-primer' },
        { pattern: /\bprimer\b(?!.*pre)/i, level: 'primer' },
        { pattern: /first[- ]?grade|1st[- ]?grade|grade[- ]?1/i, level: 'first-grade' },
        { pattern: /second[- ]?grade|2nd[- ]?grade|grade[- ]?2/i, level: 'second-grade' }
      ];
      
      let selectedLevel: SightWordLevel | null = null;
      
      for (const msg of messages) {
        if (msg.role === 'user' && typeof msg.content === 'string') {
          const content = msg.content;
          for (const { pattern, level } of levelPatterns) {
            if (pattern.test(content)) {
              selectedLevel = level;
              break;
            }
          }
          if (selectedLevel) break;
        }
      }
      
      if (selectedLevel && isValidSightWordLevel(selectedLevel)) {
        const words = getWordsForLevel(selectedLevel);
        const topWords = getTopWordsForLevel(selectedLevel, 6);
        if (words.length > 0) {
          const wordList = words.join(', ');
          sightWordsContext = `\n\n📖 SIGHT WORDS FOR ${getSightWordLevelLabel(selectedLevel).toUpperCase()} LEVEL:\n⚠️ CRITICAL: You MUST ONLY use words from this list for the book. Do NOT invent or suggest words outside this curated list.\n\n**Available Words:** ${wordList}\n\n**COVER PAGE REQUIREMENT:** The cover image prompt MUST include these specific sight words floating in colorful bubbles: ${topWords.join(', ')}\n\nExample cover prompt format:\n"[Art style]. [Character] in [scene]. CRITICAL INSTRUCTION: Display the book title '[TITLE]' in large, bold, CENTERED text. Include these sight words floating in colorful bubbles around the character: ${topWords.join(', ')}. Full frame."`;
          console.log(`📚 Sight Words corpus: Injected ${words.length} words for "${selectedLevel}" level`);
        }
      }
    }


    // Character theme context (only if character_theme question is enabled)
    const isCharacterThemeEnabled = enabledQuestions.has('character_theme');
    const themeContext = isCharacterThemeEnabled
      ? characterTheme
        ? characterTheme === 'custom'
          ? `\n\n⚠️ CRITICAL - THEME STATUS:\n🎨 CUSTOM THEME REQUESTED - The user wants a custom character theme but hasn't specified it yet. Ask them: "What character, style, or theme would you like? (e.g., dinosaurs, unicorns, superheroes, ocean animals)" Once they provide their custom theme, integrate it throughout the book outline.\n\n❌ DO NOT ask "What character theme would you like?" - this step is complete.`
          : characterTheme === 'no-theme'
          ? `\n\n⚠️ CRITICAL - THEME STATUS:\n📚 NO THEME - The user prefers an educational-only book without character themes. Focus purely on educational content with classic, simple illustrations. Do NOT integrate any character themes.\n\n❌ DO NOT ask about character themes - this step is complete. Proceed to grade level.`
          : `\n\n⚠️ CRITICAL - THEME STATUS:\n🎨 THEME ALREADY SELECTED: "${characterTheme}"\n❌ DO NOT ask "What character theme would you like?" - Step 1 is COMPLETE.\n✅ PROCEED to Step 2 (Grade Level) or Step 3 if grade is also set.\nIntegrate "${characterTheme}" character throughout the book outline including cover page, educational focus page, and all content pages.`
        : ''
      : `\n\n📋 CHARACTER THEME QUESTION DISABLED: Do NOT ask about character themes. Proceed with educational content without themed characters.`;

    // Character constraints for selected characters - now fetched from database
    let characterConstraintsContext = '';
    let characterThemeContext = '';
    console.log(`🎭 Character selection received:`, { characterTheme, selectedCharacterIds });
    if (selectedCharacterIds && selectedCharacterIds.length > 0 && characterTheme) {
      const constraints = await buildCharacterConstraints(supabase, characterTheme, selectedCharacterIds);
      if (constraints) {
        characterConstraintsContext = `\n\n${constraints}`;
        console.log(`🎭 Character constraints applied for ${characterTheme}:`, selectedCharacterIds);
      }
      // CRITICAL: Tell AI not to re-ask for character theme/selection - they're already confirmed
      const characterCount = selectedCharacterIds.length;
      const characterWord = characterCount === 1 ? 'CHARACTER' : 'CHARACTERS';
      characterThemeContext = `\n\n⚠️ CRITICAL - CHARACTER SELECTION COMPLETE:\n🎨 THEME: ${characterTheme}\n🎭 ${characterWord} CONFIRMED (${characterCount}): ${selectedCharacterIds.join(', ')}\n\n🚫 FORBIDDEN ACTIONS:\n- DO NOT ask "Which character theme would you like?"\n- DO NOT ask "Which characters should appear?"\n- DO NOT show character selection UI\n- DO NOT re-confirm character selection\n\n✅ REQUIRED ACTION: Proceed IMMEDIATELY to the NEXT step in the conversation flow.\nFor Manners books: Ask about manner type (eating habits, greeting others, etc.)\nFor other books: Ask about grade level or other discovery questions.`;
    }

    // Season context - optional discovery question
    const seasonContext = season && isValidSeason(season)
      ? `\n\n⚠️ CRITICAL - SEASON STATUS:\n🗓️ SEASON ALREADY SELECTED: ${getSeasonDisplay(season)}\n❌ DO NOT ask "What season?" - this step is COMPLETE.\nIntegrate ${getSeasonDisplay(season)} seasonal elements, colors, activities, and atmosphere throughout the book's illustrations and content.`
      : '';

    // Environment context - optional discovery question
    // For Manners books, use manners-specific environments (home/school)
    // For other books, use standard environments (city, resort, etc.)
    const isMannerBook = bookType === 'manners';
    const mannersEnvironmentContext = isMannerBook && environment && isValidMannersEnvironment(environment)
      ? `\n\n⚠️ CRITICAL - MANNERS ENVIRONMENT STATUS:\n🏠 ENVIRONMENT ALREADY SELECTED: ${getMannersEnvironmentDisplay(environment as ValidMannersEnvironment)}\n❌ DO NOT ask "Where should this take place?" or "What environment?" - this step is COMPLETE.\nSet all illustrations and content in a ${getMannersEnvironmentDisplay(environment as ValidMannersEnvironment)} environment with appropriate settings and scenarios.`
      : '';
    const standardEnvironmentContext = !isMannerBook && environment && isValidEnvironment(environment)
      ? `\n\n⚠️ CRITICAL - ENVIRONMENT STATUS:\n🌍 ENVIRONMENT ALREADY SELECTED: ${getEnvironmentDisplay(environment)}\n❌ DO NOT ask "What environment/setting?" - this step is COMPLETE.\nSet all illustrations and content in a ${getEnvironmentDisplay(environment)} environment with appropriate scenery, landmarks, and atmosphere.`
      : '';
    const environmentContext = mannersEnvironmentContext || standardEnvironmentContext;

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

    // City context - optional discovery question for urban setting (only if city question is enabled)
    const isCityEnabled = enabledQuestions.has('city');
    const cityVisualPrompt = city && isValidCity(city) ? getCityVisualPromptSync(city) : null;
    const cityContext = isCityEnabled
      ? (city && isValidCity(city)
          ? `\n\n⚠️ CRITICAL - CITY STATUS:\n🏙️ CITY ALREADY SELECTED: ${getCityDisplaySync(city)}\n❌ DO NOT ask "Which city?" - this step is COMPLETE.${cityVisualPrompt || ''}`
          : '')
      : `\n\n📋 CITY QUESTION DISABLED: Do NOT ask about city/location preferences.`;

    // Manner type context - for Manners book agent
    // Labels now fetched from database via frontend - only need context injection here
    const mannerTypeContext = mannerType
      ? `\n\n⚠️ CRITICAL - MANNER TYPE STATUS:\n📚 MANNER TYPE ALREADY SELECTED: ${mannerType}\n❌ DO NOT ask "What type of manners?" - this step is COMPLETE.`
      : '';

    // Manners setting context - where the manners should take place (home, school, both)
    // Frontend handles question display via useDiscoveryFlow - edge function just receives answers
    const mannersSettingContext = mannersSetting
      ? `\n\n⚠️ CRITICAL - MANNERS SETTING STATUS:\n🏠 SETTING ALREADY SELECTED: ${mannersSetting}\n❌ DO NOT ask "Where should this manners book take place?" - this step is COMPLETE.`
      : '';

    // Frontend-driven discovery context - all answers collected by useDiscoveryFlow
    // This provides context from type-specific discovery questions answered in the frontend
    const discoveryContextInjection = discoveryContext && Object.keys(discoveryContext).length > 0
      ? `\n\n📋 DISCOVERY CONTEXT (from frontend):\n${Object.entries(discoveryContext).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n⚠️ These discovery questions have already been answered. DO NOT re-ask any of these questions.`
      : '';

    // DYNAMIC QUESTION INJECTION SYSTEM
    // Build set of context keys that have already been provided (to avoid re-asking)
    const existingContextKeys = new Set<string>();
    if (gradeLevel) existingContextKeys.add('gradeLevel');
    if (characterTheme) existingContextKeys.add('characterTheme');
    if (season) existingContextKeys.add('season');
    if (environment) existingContextKeys.add('environment');
    if (clothingBrand) existingContextKeys.add('clothingBrand');
    if (location) existingContextKeys.add('location');
    if (city) existingContextKeys.add('city');
    if (mannerType) existingContextKeys.add('mannerType');
    if (mannersSetting) existingContextKeys.add('mannersSetting');
    
    // Add discovery context keys
    if (discoveryContext) {
      Object.keys(discoveryContext).forEach(key => existingContextKeys.add(key));
    }
    
    // Extract which questions have been answered from conversation history
    const answeredQuestionIds = extractAnsweredQuestions(messages, enabledQuestionsWithDetails);
    console.log(`📋 Answered questions from conversation:`, Array.from(answeredQuestionIds));
    
    // Build dynamic [SUGGEST] block for the next unanswered question
    const dynamicDiscoveryBlock = buildDynamicDiscoveryBlock(
      enabledQuestionsWithDetails,
      answeredQuestionIds,
      existingContextKeys
    );
    
    if (dynamicDiscoveryBlock) {
      console.log(`🎯 Dynamic discovery block injected for next unanswered question`);
    }

    // Check if all dynamic questions are complete (for proceeding to title)
    const allDynamicQuestionsComplete = enabledQuestionsWithDetails.every(eq => 
      answeredQuestionIds.has(eq.question_id) || 
      existingContextKeys.has(eq.question_id) ||
      existingContextKeys.has(eq.question_id.replace('_', ''))
    );
    
    // All optional questions complete when both frontend-driven and dynamic questions are done
    const allOptionalQuestionsComplete = allDynamicQuestionsComplete && !dynamicDiscoveryBlock;

    // Check if user is forcing outline creation (e.g., typing "create outline")
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const lastMessageContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content.toLowerCase() : '';
    const forceOutline = lastMessageContent.includes('create outline') || lastMessageContent.includes('generate outline');

    // Detect if user just approved title
    const titleApprovalPhrases = ['looks perfect', 'create the outline', 'create outline', 'looks great', 'perfect!', 'approved', 'let\'s create'];
    const titleWasJustApproved = titleApprovalPhrases.some(phrase => lastMessageContent.includes(phrase));
    
    // Get category word for title requirement
    const categoryWord = bookType ? getBookTypeCategoryWord(normalizeBookType(bookType)) : 'Adventure';
    
    // Proceed to title context with category requirement
    const proceedToTitleContext = allOptionalQuestionsComplete && !outlineReady && !bookCreated && !titleWasJustApproved
      ? `\n\n✅ ALL OPTIONAL QUESTIONS COMPLETE: All discovery questions have been answered or skipped. NOW propose a book title and description for user approval.

📛 TITLE REQUIREMENT: The book title MUST include the category word "${categoryWord}" somewhere in the title.
✅ Good examples: "Bluey's ${categoryWord} Adventure", "Chase's ${categoryWord} Fun", "${categoryWord} with Elsa"
❌ Bad examples: Titles without "${categoryWord}" in them

The title confirmation ("✅ Create My Book!") is the VERY LAST step before generating the outline.`
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
    // Dynamic discovery block is injected to present the next unanswered question from agent_questions
    const systemMessage: Message = {
      role: 'system',
      content: systemPromptContent + languageContext + gradeContext + curatedItemsContext + digraphWordsContext + sightWordsContext + themeContext + characterConstraintsContext + characterThemeContext + seasonContext + environmentContext + clothingBrandContext + locationContext + cityContext + mannerTypeContext + mannersSettingContext + discoveryContextInjection + dynamicDiscoveryBlock + proceedToTitleContext + titleConfirmationContext + conversationStageContext,
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
    console.log(`📚 Manner type: ${mannerType || 'None'}`);
    console.log(`🏠 Manners setting: ${mannersSetting || 'None'}`);
    console.log(`📋 Discovery context: ${discoveryContext ? JSON.stringify(discoveryContext) : 'None'}`);
    console.log(`📋 Dynamic discovery block active: ${dynamicDiscoveryBlock ? 'Yes' : 'No'}`);
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
