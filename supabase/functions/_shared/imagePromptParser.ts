/**
 * Image Prompt JSON Parser and Transformer
 * Handles parsing JSON responses from Graphics Designer Agent and transforming them into optimized text prompts
 */

export interface ImagePromptJSON {
  subject: {
    primary: string;
    letter: string;
  };
  scene: {
    setting: string;
    style: string;
  };
  colors: {
    primary: string;
    background: string;
  };
  educational: {
    letterEmphasis: string;
    ageAppropriate: boolean;
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
      typeof data.subject.letter === 'string' &&
      // Scene validation
      data.scene &&
      typeof data.scene === 'object' &&
      typeof data.scene.setting === 'string' &&
      typeof data.scene.style === 'string' &&
      // Colors validation
      data.colors &&
      typeof data.colors === 'object' &&
      typeof data.colors.primary === 'string' &&
      typeof data.colors.background === 'string' &&
      // Educational validation
      data.educational &&
      typeof data.educational === 'object' &&
      typeof data.educational.letterEmphasis === 'string' &&
      typeof data.educational.ageAppropriate === 'boolean'
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
  const { subject, scene, colors, educational } = json;

  // Build a concise prompt focusing on essentials
  const prompt = `A ${scene.style} illustration of ${subject.primary} prominently featuring the letter "${subject.letter}" in ${scene.setting}. ${educational.letterEmphasis}. Use primary color ${colors.primary} and background color ${colors.background}. Child-friendly, educational ABC book style, 1024x1024 square format.`;

  return prompt;
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