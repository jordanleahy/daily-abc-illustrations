/**
 * Transform structured JSON config into human-readable system prompt content
 * Shared utility for edge functions
 */

interface ColorPalette {
  primary: { hex: string; hsl: string; usage: string; };
  secondary: { hex: string; hsl: string; usage: string; };
  accent: { hex: string; hsl: string; usage: string; };
  supporting: { hex: string; hsl: string; usage: string; };
  background: { hex: string; hsl: string; usage: string; };
  text: { hex: string; hsl: string; usage: string; };
}

interface VisualMetaphors {
  metaphor1: { concept: string; visualRepresentation: string; implementation: string; };
  metaphor2: { concept: string; visualRepresentation: string; implementation: string; };
  metaphor3: { concept: string; visualRepresentation: string; implementation: string; };
}

interface CompositionGuidelines {
  layoutFlow: string;
  focusHierarchy: string[];
  spacingRules: string;
  balanceStrategy: string;
}

interface VisualElements {
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

interface StyleRequirements {
  artStyle: string;
  subjects: string[];
  flowIndicators: string[];
  tone: string;
  technicalSpecs: {
    aspectRatio: string;
    resolution: string;
    format: string;
  };
}

interface ContentAnalysisFramework {
  lens1: { name: string; description: string; checkpoints: string[]; };
  lens2: { name: string; description: string; checkpoints: string[]; };
  lens3: { name: string; description: string; checkpoints: string[]; };
}

interface IllustrationConfig {
  metadata: {
    category: string;
    theme: string;
    audience: string;
    useCases: string[];
    styleTags: string[];
    status: string;
    version: string;
    generatedAt: string;
  };
  colorPalette: ColorPalette;
  visualElements: VisualElements;
  styleRequirements: StyleRequirements;
  compositionGuidelines: CompositionGuidelines;
  visualMetaphors?: VisualMetaphors;
  visualMetaphor?: any; // Fallback for inconsistent AI responses
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
  configVersion: string;
  configHash?: string;
  lastTransformed?: string;
}

export function transformConfigToContent(config: IllustrationConfig): string {
  // Safely access visualMetaphors with fallback for singular form
  const visualMetaphors = config.visualMetaphors || config.visualMetaphor || {};
  const metaphor1 = visualMetaphors.metaphor1 || {};
  const metaphor2 = visualMetaphors.metaphor2 || {};
  const metaphor3 = visualMetaphors.metaphor3 || {};

  return `You are an illustration director creating images for "${config.metadata?.theme || 'Unknown Theme'}" - a ${config.metadata?.category || 'Unknown Category'} ABC book for ${config.metadata?.audience || 'children'}.

## Visual Style Direction
Art Style: ${config.styleRequirements?.artStyle || 'Not specified'}
Overall Tone: ${config.styleRequirements?.tone || 'friendly'}
Layout Approach: ${config.compositionGuidelines?.layoutFlow || 'Not specified'}

## Color Palette
- Primary: ${config.colorPalette?.primary?.hex || '#000000'} (${config.colorPalette?.primary?.usage || 'primary elements'})
- Secondary: ${config.colorPalette?.secondary?.hex || '#666666'} (${config.colorPalette?.secondary?.usage || 'secondary elements'})
- Accent: ${config.colorPalette?.accent?.hex || '#FF0000'} (${config.colorPalette?.accent?.usage || 'accents'})
- Supporting: ${config.colorPalette?.supporting?.hex || '#888888'} (${config.colorPalette?.supporting?.usage || 'supporting elements'})
- Background: ${config.colorPalette?.background?.hex || '#FFFFFF'} (${config.colorPalette?.background?.usage || 'backgrounds'})
- Text: ${config.colorPalette?.text?.hex || '#000000'} (${config.colorPalette?.text?.usage || 'text'})

## Key Visual Metaphors

### 1. ${metaphor1.concept || 'Visual Concept 1'}
${metaphor1.visualRepresentation || 'Visual representation not specified'}
**Implementation:** ${metaphor1.implementation || 'Implementation details not specified'}

### 2. ${metaphor2.concept || 'Visual Concept 2'}
${metaphor2.visualRepresentation || 'Visual representation not specified'}
**Implementation:** ${metaphor2.implementation || 'Implementation details not specified'}

### 3. ${metaphor3.concept || 'Visual Concept 3'}
${metaphor3.visualRepresentation || 'Visual representation not specified'}
**Implementation:** ${metaphor3.implementation || 'Implementation details not specified'}
## Composition Guidelines
${config.compositionGuidelines?.spacingRules || 'Spacing rules not specified'}
**Balance Strategy:** ${config.compositionGuidelines?.balanceStrategy || 'Balance strategy not specified'}

## Visual Elements

### Required Foreground Elements
${config.visualElements?.foregroundElements?.required?.map(item => `- ${item}`).join('\n') || '- No requirements specified'}

### Optional Elements
${config.visualElements?.foregroundElements?.optional?.map(item => `- ${item}`).join('\n') || '- No optional elements specified'}

### Style Requirements
${config.visualElements?.foregroundElements?.style || 'Style requirements not specified'}

### Background Foundation
**Setting:** ${config.visualElements?.backgroundFoundation?.setting || 'Setting not specified'}
**Gradients:** ${config.visualElements?.backgroundFoundation?.gradients?.join(', ') || 'No gradients specified'}
**Textures:** ${config.visualElements?.backgroundFoundation?.textures?.join(', ') || 'No textures specified'}
**Whitespace:** ${config.visualElements?.backgroundFoundation?.whitespace || 'Whitespace rules not specified'}

## Technical Specifications
- Format: ${config.styleRequirements?.technicalSpecs?.format || 'Format not specified'}
- Resolution: ${config.styleRequirements?.technicalSpecs?.resolution || 'Resolution not specified'}
- Aspect Ratio: ${config.styleRequirements?.technicalSpecs?.aspectRatio || 'Aspect ratio not specified'}

## Content Analysis Framework

### ${config.contentAnalysisFramework?.lens1?.name || 'Analysis Lens 1'}
${config.contentAnalysisFramework?.lens1?.description || 'Description not provided'}
Checkpoints: ${config.contentAnalysisFramework?.lens1?.checkpoints?.map(item => `- ${item}`).join('\n') || '- No checkpoints specified'}

### ${config.contentAnalysisFramework?.lens2?.name || 'Analysis Lens 2'}
${config.contentAnalysisFramework?.lens2?.description || 'Description not provided'}
Checkpoints: ${config.contentAnalysisFramework?.lens2?.checkpoints?.map(item => `- ${item}`).join('\n') || '- No checkpoints specified'}

### ${config.contentAnalysisFramework?.lens3?.name || 'Analysis Lens 3'}
${config.contentAnalysisFramework?.lens3?.description || 'Description not provided'}
Checkpoints: ${config.contentAnalysisFramework?.lens3?.checkpoints?.map(item => `- ${item}`).join('\n') || '- No checkpoints specified'}

## Output Instructions
**Visual Focus:** ${config.outputInstructions?.visualFocus?.join(', ') || 'Visual focus not specified'}
**Text Constraints:** ${config.outputInstructions?.textConstraints?.join(', ') || 'Text constraints not specified'}
**Educational Approach:** ${config.outputInstructions?.educationalApproach?.join(', ') || 'Educational approach not specified'}

## Safety & Content Guidelines
**Age-Appropriate Elements:** ${config.safetyGuidelines?.ageAppropriate?.join(', ') || 'Age-appropriate guidelines not specified'}
**Required Elements:** ${config.safetyGuidelines?.required?.join(', ') || 'Required elements not specified'}
**Prohibited Content:** ${config.safetyGuidelines?.prohibited?.join(', ') || 'Prohibited content not specified'}

---
*This style guide was generated from structured configuration v${config.configVersion || 'Unknown'}*`;
}