/**
 * Image Prompt JSON Parser and Transformer
 * Handles parsing JSON responses from Graphics Designer Agent and transforming them into optimized text prompts
 */

export interface ImagePromptJSON {
  subject: {
    primary: string;
    secondary?: string[];
    letterFocus: string;
  };
  scene: {
    setting: string;
    environment: string;
    timeOfDay?: string;
  };
  style: {
    artStyle: string;
    tone: string;
    visualMetaphors: string[];
  };
  lighting: {
    primary: string;
    mood: string;
    shadows?: string;
  };
  composition: {
    layout: string;
    focusPoints: string[];
    balance: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  educational: {
    letterEmphasis: string;
    learningObjective: string;
    ageAppropriate: boolean;
  };
  technical: {
    aspectRatio: string;
    resolution?: string;
    format?: string;
  };
  safety: {
    contentFlags: string[];
    prohibitedElements: string[];
    requiredElements: string[];
  };
}

export interface ParsedImagePrompt {
  isValid: boolean;
  json?: ImagePromptJSON;
  transformedText: string;
  rawResponse: string;
  parseError?: string;
}

/**
 * Validates if parsed data matches the ImagePromptJSON schema
 */
export function validateImagePromptJSON(data: any): data is ImagePromptJSON {
  try {
    return (
      data &&
      typeof data === 'object' &&
      // Subject validation
      data.subject &&
      typeof data.subject === 'object' &&
      typeof data.subject.primary === 'string' &&
      typeof data.subject.letterFocus === 'string' &&
      // Scene validation
      data.scene &&
      typeof data.scene === 'object' &&
      typeof data.scene.setting === 'string' &&
      typeof data.scene.environment === 'string' &&
      // Style validation (basic)
      data.style &&
      typeof data.style === 'object' &&
      typeof data.style.artStyle === 'string' &&
      // Lighting validation (basic)
      data.lighting &&
      typeof data.lighting === 'object' &&
      // Colors validation (basic)
      data.colors &&
      typeof data.colors === 'object' &&
      // Educational validation (basic)
      data.educational &&
      typeof data.educational === 'object' &&
      // Technical validation (basic)
      data.technical &&
      typeof data.technical === 'object' &&
      // Safety validation (basic)
      data.safety &&
      typeof data.safety === 'object'
    );
  } catch (error) {
    return false;
  }
}

/**
 * Extracts JSON from AI response, handling various formats (code blocks, plain text, etc.)
 */
export function extractJSON(rawResponse: string): string | null {
  if (!rawResponse || typeof rawResponse !== 'string') {
    return null;
  }

  // Try to find JSON in code blocks first
  const codeBlockMatches = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi);
  if (codeBlockMatches && codeBlockMatches.length > 0) {
    // Extract the content inside the code block
    const match = codeBlockMatches[0].replace(/```(?:json)?\s*/, '').replace(/\s*```$/, '');
    return match.trim();
  }

  // Try to find JSON object in the text
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // If response looks like it starts with JSON, return as-is
  if (rawResponse.trim().startsWith('{') && rawResponse.trim().endsWith('}')) {
    return rawResponse.trim();
  }

  return null;
}

/**
 * Transforms validated JSON into optimized image prompt text
 */
export function transformJSONToPrompt(json: ImagePromptJSON): string {
  const {
    subject,
    scene,
    style,
    lighting,
    composition,
    colors,
    educational,
    technical,
    safety
  } = json;

  // Build the prompt in a structured way
  const promptParts: string[] = [];

  // Subject and educational focus
  promptParts.push(`${subject.primary} prominently featuring the letter "${subject.letterFocus}"`);
  
  if (subject.secondary && Array.isArray(subject.secondary) && subject.secondary.length > 0) {
    promptParts.push(`with ${subject.secondary.join(', ')}`);
  }

  // Scene and environment
  promptParts.push(`in ${scene.setting}, ${scene.environment}`);
  
  if (scene.timeOfDay) {
    promptParts.push(`during ${scene.timeOfDay}`);
  }

  // Style and artistic treatment
  promptParts.push(`rendered in ${style.artStyle} style`);
  
  if (style.tone) {
    promptParts.push(`with ${style.tone} tone`);
  }
  
  if (style.visualMetaphors && Array.isArray(style.visualMetaphors) && style.visualMetaphors.length > 0) {
    promptParts.push(`incorporating visual metaphors: ${style.visualMetaphors.join(', ')}`);
  }

  // Lighting and mood
  promptParts.push(`${lighting.primary} lighting creating ${lighting.mood} mood`);
  
  if (lighting.shadows) {
    promptParts.push(`with ${lighting.shadows} shadows`);
  }

  // Composition details
  promptParts.push(`using ${composition.layout} composition`);
  
  if (composition.focusPoints && composition.focusPoints.length > 0) {
    promptParts.push(`focusing on ${composition.focusPoints.join(', ')}`);
  }
  
  promptParts.push(`with ${composition.balance} balance`);

  // Color specifications
  promptParts.push(`Color palette: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}, background ${colors.background}`);

  // Educational emphasis
  promptParts.push(`Educational focus: ${educational.letterEmphasis} for ${educational.learningObjective}`);

  // Technical specifications
  promptParts.push(`Aspect ratio: ${technical.aspectRatio}`);
  
  if (technical.resolution) {
    promptParts.push(`Resolution: ${technical.resolution}`);
  }
  
  if (technical.format) {
    promptParts.push(`Format: ${technical.format}`);
  }

  // Safety requirements
  if (safety.requiredElements && safety.requiredElements.length > 0) {
    promptParts.push(`Required elements: ${safety.requiredElements.join(', ')}`);
  }
  
  if (safety.prohibitedElements && safety.prohibitedElements.length > 0) {
    promptParts.push(`Avoid: ${safety.prohibitedElements.join(', ')}`);
  }

  // Join all parts into a coherent prompt
  return promptParts.join(', ') + '.';
}

/**
 * Main function to parse AI response and return structured result
 */
export function parseImagePromptResponse(rawResponse: string): ParsedImagePrompt {
  const result: ParsedImagePrompt = {
    isValid: false,
    transformedText: '',
    rawResponse: rawResponse.trim()
  };

  try {
    // Extract JSON from response
    const jsonString = extractJSON(rawResponse);
    
    if (!jsonString) {
      result.parseError = 'No JSON found in response';
      result.transformedText = rawResponse.trim(); // Fallback to raw text
      return result;
    }

    // Parse JSON
    let parsedJSON: any;
    try {
      parsedJSON = JSON.parse(jsonString);
    } catch (parseError) {
      result.parseError = `JSON parsing failed: ${parseError.message}`;
      result.transformedText = rawResponse.trim(); // Fallback to raw text
      return result;
    }

    // Validate JSON structure
    if (!validateImagePromptJSON(parsedJSON)) {
      result.parseError = 'JSON does not match expected schema';
      result.transformedText = rawResponse.trim(); // Fallback to raw text
      return result;
    }

    // Success - transform JSON to optimized text prompt
    result.isValid = true;
    result.json = parsedJSON;
    result.transformedText = transformJSONToPrompt(parsedJSON);
    
    return result;

  } catch (error) {
    result.parseError = `Unexpected error: ${error.message}`;
    result.transformedText = rawResponse.trim(); // Fallback to raw text
    return result;
  }
}