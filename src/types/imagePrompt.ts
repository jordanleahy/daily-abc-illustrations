/**
 * Simplified JSON schema for structured image prompts from Graphics Designer Agent
 * Focuses on essential elements for clear, concise image generation
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

/**
 * Result of parsing and validating JSON image prompt
 */
export interface ParsedImagePrompt {
  isValid: boolean;
  json?: ImagePromptJSON;
  transformedText: string;
  rawResponse: string;
  parseError?: string;
}