/**
 * JSON Schema for Illustration Director Style Guide Output
 * Provides structured, consistent design system definitions
 */

export interface ColorPalette {
  primary: {
    hex: string;
    hsl: string;
    usage: string;
  };
  secondary: {
    hex: string;
    hsl: string;
    usage: string;
  };
  accent: {
    hex: string;
    hsl: string;
    usage: string;
  };
  supporting: {
    hex: string;
    hsl: string;
    usage: string;
  };
  background: {
    hex: string;
    hsl: string;
    usage: string;
  };
  text: {
    hex: string;
    hsl: string;
    usage: string;
  };
}

export interface VisualMetaphors {
  metaphor1: {
    concept: string;
    visualRepresentation: string;
    implementation: string;
  };
  metaphor2: {
    concept: string;
    visualRepresentation: string;
    implementation: string;
  };
  metaphor3: {
    concept: string;
    visualRepresentation: string;
    implementation: string;
  };
}

export interface CompositionGuidelines {
  layoutFlow: 'triangular' | 'left-to-right' | 'modular-cards' | 'centered' | 'grid';
  focusHierarchy: string[];
  spacingRules: string;
  balanceStrategy: string;
}

export interface VisualElements {
  foregroundElements: {
    required: string[];
    optional: string[];
    style: string;
  };
  midgroundContext: {
    connectors: string[];
    workflows: string[];
    contextual: string[];
  };
  backgroundFoundation: {
    setting: string;
    gradients: string[];
    textures: string[];
    whitespace: string;
  };
}

export interface StyleRequirements {
  artStyle: string;
  subjects: string[];
  flowIndicators: string[];
  tone: 'gentle' | 'practical' | 'trustworthy' | 'empathetic' | 'playful' | 'educational';
  technicalSpecs: {
    aspectRatio: string;
    resolution: string;
    format: string;
  };
}

export interface ContentAnalysisFramework {
  lens1: {
    name: string;
    description: string;
    checkpoints: string[];
  };
  lens2: {
    name: string;
    description: string;
    checkpoints: string[];
  };
  lens3: {
    name: string;
    description: string;
    checkpoints: string[];
  };
}

export interface StyleGuideJSON {
  metadata: {
    category: string;
    theme: string;
    audience: string;
    useCases: string[];
    styleTags: string[];
    status: 'active' | 'draft' | 'archived';
    version: string;
    generatedAt: string;
  };
  colorPalette: ColorPalette;
  visualElements: VisualElements;
  styleRequirements: StyleRequirements;
  compositionGuidelines: CompositionGuidelines;
  visualMetaphors: VisualMetaphors;
  contentAnalysisFramework: ContentAnalysisFramework;
  outputInstructions: {
    visualFocus: string[];
    textConstraints: string[];
    educationalApproach: string[];
  };
  safetyGuidelines: {
    prohibited: string[];
    required: string[];
    ageAppropriate: string[];
  };
}

/**
 * Utility function to validate StyleGuideJSON structure
 */
export function validateStyleGuide(data: any): data is StyleGuideJSON {
  return (
    data &&
    typeof data === 'object' &&
    data.metadata &&
    data.colorPalette &&
    data.visualElements &&
    data.styleRequirements &&
    data.compositionGuidelines &&
    data.visualMetaphors &&
    data.contentAnalysisFramework &&
    data.outputInstructions &&
    data.safetyGuidelines
  );
}

/**
 * Utility function to extract specific design elements
 */
export function extractDesignElements(styleGuide: StyleGuideJSON) {
  return {
    colors: {
      primary: styleGuide.colorPalette.primary.hex,
      secondary: styleGuide.colorPalette.secondary.hex,
      accent: styleGuide.colorPalette.accent.hex,
    },
    style: styleGuide.styleRequirements.artStyle,
    tone: styleGuide.styleRequirements.tone,
    composition: styleGuide.compositionGuidelines.layoutFlow,
    metaphors: [
      styleGuide.visualMetaphors.metaphor1.concept,
      styleGuide.visualMetaphors.metaphor2.concept,
      styleGuide.visualMetaphors.metaphor3.concept,
    ],
  };
}