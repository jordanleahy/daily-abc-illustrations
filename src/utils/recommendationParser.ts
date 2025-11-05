export interface BookRecommendation {
  title: string;
  description: string;
}

export interface ParsedRecommendations {
  recommendations: BookRecommendation[];
  remainingText: string;
}

/**
 * Parses AI text responses to extract book recommendations
 * Supports multiple formats:
 * - **Title:** Description
 * - 1. Title - Description
 * - Title\nDescription (multi-line)
 */
export const parseRecommendations = (text: string): ParsedRecommendations => {
  if (!text || typeof text !== 'string') {
    return { recommendations: [], remainingText: text || '' };
  }

  const recommendations: BookRecommendation[] = [];
  let processedText = text;

  // Pattern 1: **Title:** Description (most common from AI)
  const boldTitlePattern = /\*\*([^*]+)\*\*:\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/g;
  let match;
  let hasMatches = false;

  while ((match = boldTitlePattern.exec(text)) !== null) {
    hasMatches = true;
    const title = match[1].trim();
    const description = match[2].trim();
    
    if (title && description) {
      recommendations.push({ title, description });
    }
  }

  // If we found recommendations with bold pattern, remove them from text
  if (hasMatches) {
    processedText = text.replace(boldTitlePattern, '').trim();
  }

  // Pattern 2: Numbered list (1. Title - Description)
  if (recommendations.length === 0) {
    const numberedPattern = /^\d+\.\s+([^-\n]+)\s*-\s*(.+?)(?=\n\d+\.|\n\n|$)/gm;
    
    while ((match = numberedPattern.exec(text)) !== null) {
      hasMatches = true;
      const title = match[1].trim();
      const description = match[2].trim();
      
      if (title && description) {
        recommendations.push({ title, description });
      }
    }

    if (hasMatches) {
      processedText = text.replace(numberedPattern, '').trim();
    }
  }

  // Clean up remaining text
  processedText = processedText
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .trim();

  return {
    recommendations,
    remainingText: processedText
  };
};
