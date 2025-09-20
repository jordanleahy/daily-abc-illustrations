/**
 * JSON schema for structured image prompts from Graphics Designer Agent
 * This ensures consistent, parseable output that can be transformed into optimized text prompts
 */
export interface ImagePromptJSON {
  /** Main subject/character of the image */
  subject: {
    primary: string;
    secondary?: string[];
    letterFocus: string;
  };
  
  /** Scene setting and environment */
  scene: {
    setting: string;
    environment: string;
    timeOfDay?: string;
  };
  
  /** Visual style and artistic treatment */
  style: {
    artStyle: string;
    tone: string;
    visualMetaphors: string[];
  };
  
  /** Lighting conditions and mood */
  lighting: {
    primary: string;
    mood: string;
    shadows?: string;
  };
  
  /** Layout and positioning details */
  composition: {
    layout: string;
    focusPoints: string[];
    balance: string;
  };
  
  /** Specific colors from the style guide */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  
  /** Educational elements for learning */
  educational: {
    letterEmphasis: string;
    learningObjective: string;
    ageAppropriate: boolean;
  };
  
  /** Technical specifications */
  technical: {
    aspectRatio: string;
    resolution?: string;
    format?: string;
  };
  
  /** Safety and content guidelines */
  safety: {
    contentFlags: string[];
    prohibitedElements: string[];
    requiredElements: string[];
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