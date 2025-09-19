import { IllustrationConfig } from '@/types/illustrationConfig';

/**
 * Transform structured JSON config into human-readable system prompt content
 */
export function transformConfigToContent(config: IllustrationConfig): string {
  return `You are an illustration director creating images for "${config.metadata.theme}" - a ${config.metadata.category} ABC book for ${config.metadata.audience}.

## Visual Style Direction
Art Style: ${config.styleRequirements.artStyle}
Overall Tone: ${config.styleRequirements.tone}
Layout Approach: ${config.compositionGuidelines.layoutFlow}

## Color Palette
- Primary: ${config.colorPalette.primary.hex} (${config.colorPalette.primary.usage})
- Secondary: ${config.colorPalette.secondary.hex} (${config.colorPalette.secondary.usage})
- Accent: ${config.colorPalette.accent.hex} (${config.colorPalette.accent.usage})
- Supporting: ${config.colorPalette.supporting.hex} (${config.colorPalette.supporting.usage})
- Background: ${config.colorPalette.background.hex} (${config.colorPalette.background.usage})
- Text: ${config.colorPalette.text.hex} (${config.colorPalette.text.usage})

## Key Visual Metaphors

### 1. ${config.visualMetaphors.metaphor1.concept}
${config.visualMetaphors.metaphor1.visualRepresentation}
**Implementation:** ${config.visualMetaphors.metaphor1.implementation}

### 2. ${config.visualMetaphors.metaphor2.concept}
${config.visualMetaphors.metaphor2.visualRepresentation}
**Implementation:** ${config.visualMetaphors.metaphor2.implementation}

### 3. ${config.visualMetaphors.metaphor3.concept}
${config.visualMetaphors.metaphor3.visualRepresentation}
**Implementation:** ${config.visualMetaphors.metaphor3.implementation}

## Composition Guidelines
${config.compositionGuidelines.spacingRules}
**Balance Strategy:** ${config.compositionGuidelines.balanceStrategy}

## Visual Elements

### Required Foreground Elements
${config.visualElements.foregroundElements.required.map(item => `- ${item}`).join('\n')}

### Optional Elements
${config.visualElements.foregroundElements.optional.map(item => `- ${item}`).join('\n')}

### Style Requirements
${config.visualElements.foregroundElements.style}

### Background Foundation
**Setting:** ${config.visualElements.backgroundFoundation.setting}
**Gradients:** ${config.visualElements.backgroundFoundation.gradients.join(', ')}
**Textures:** ${config.visualElements.backgroundFoundation.textures.join(', ')}
**Whitespace:** ${config.visualElements.backgroundFoundation.whitespace}

## Technical Specifications
- Format: ${config.styleRequirements.technicalSpecs.format}
- Resolution: ${config.styleRequirements.technicalSpecs.resolution}
- Aspect Ratio: ${config.styleRequirements.technicalSpecs.aspectRatio}

## Content Analysis Framework

### ${config.contentAnalysisFramework.lens1.name}
${config.contentAnalysisFramework.lens1.description}
Checkpoints: ${config.contentAnalysisFramework.lens1.checkpoints.map(item => `- ${item}`).join('\n')}

### ${config.contentAnalysisFramework.lens2.name}
${config.contentAnalysisFramework.lens2.description}
Checkpoints: ${config.contentAnalysisFramework.lens2.checkpoints.map(item => `- ${item}`).join('\n')}

### ${config.contentAnalysisFramework.lens3.name}
${config.contentAnalysisFramework.lens3.description}
Checkpoints: ${config.contentAnalysisFramework.lens3.checkpoints.map(item => `- ${item}`).join('\n')}

## Output Instructions
**Visual Focus:** ${config.outputInstructions.visualFocus.join(', ')}
**Text Constraints:** ${config.outputInstructions.textConstraints.join(', ')}
**Educational Approach:** ${config.outputInstructions.educationalApproach.join(', ')}

## Safety & Content Guidelines
**Age-Appropriate Elements:** ${config.safetyGuidelines.ageAppropriate.join(', ')}
**Required Elements:** ${config.safetyGuidelines.required.join(', ')}
**Prohibited Content:** ${config.safetyGuidelines.prohibited.join(', ')}

---
*This style guide was generated from structured configuration v${config.configVersion}*`;
}