/**
 * Simple paragraph-based image prompt structure
 * Graphics Designer Agent now generates natural language paragraphs instead of JSON
 */

/**
 * Result of processing image prompt from AI
 */
export interface ParsedImagePrompt {
  /** Whether the prompt is valid and ready to use */
  isValid: boolean;
  /** The cleaned, formatted prompt text */
  formattedText: string;
  /** The raw response from the AI */
  rawResponse: string;
  /** Any error that occurred during processing */
  parseError?: string;
}

/**
 * Legacy JSON schema (deprecated - kept for backward compatibility)
 * Old prompts may still use this format
 */
export interface ImagePromptJSON {
  /** Main subject and letter focus */
  subject: {
    primary: string;
    letter: string;
  };
  
  /** Scene description */
  scene: {
    setting: string;
    style: string;
  };
  
  /** Key colors for consistency */
  colors: {
    primary: string;
    background: string;
  };
  
  /** Educational focus */
  educational: {
    letterEmphasis: string;
    ageAppropriate: boolean;
  };
}
