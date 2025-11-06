/**
 * Chat utility functions for parsing and processing chat messages
 */

export interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

/**
 * Parse page details from chat messages containing book outline
 */
export const parsePageDetailsFromMessages = (messages: any[]): PageDetail[] | null => {
  // Find the last assistant message containing the book outline
  const lastAssistantMsg = [...messages].reverse().find(
    msg => msg.role === 'assistant' && 
    typeof msg.content === 'string' && 
    /\*\*Page\s+\d+:/i.test(msg.content)
  );
  
  if (!lastAssistantMsg || typeof lastAssistantMsg.content !== 'string') {
    return null;
  }
  
  // Regex pattern to match: **Page 16: "I"*** OR **Page 16: my** (quotes optional)
  const pagePattern = /\*\*Page\s+(\d+):\s*["']?([^"'\n*]+)["']?\*+\s*\n([^\n]+(?:\n(?!\*\*Page)[^\n]+)*)/gi;
  const pages: PageDetail[] = [];
  let match;
  
  while ((match = pagePattern.exec(lastAssistantMsg.content)) !== null) {
    const [, pageNum, title, description] = match;
    pages.push({
      pageNumber: parseInt(pageNum, 10),
      title: title.trim(),
      description: description.trim().replace(/\n/g, ' ') // Single line
    });
  }
  
  return pages.length > 0 ? pages : null;
};

/**
 * Educational Focus metadata extracted from AI messages
 */
export interface EducationalFocusDetail {
  targetAge: string;
  learningType: string;
  specificSkill: string;
  imagePrompt: string;
}

/**
 * Parse educational focus section from chat messages
 */
export const parseEducationalFocus = (messages: any[]): EducationalFocusDetail | null => {
  const lastAssistantMsg = [...messages].reverse().find(
    msg => msg.role === 'assistant' && 
    typeof msg.content === 'string' && 
    /\*\*Educational Focus:\*\*/i.test(msg.content)
  );
  
  if (!lastAssistantMsg || typeof lastAssistantMsg.content !== 'string') {
    return null;
  }
  
  const content = lastAssistantMsg.content;
  
  // Extract the three badge fields
  const ageMatch = content.match(/Target Age:\s*([^\n]+)/i);
  const typeMatch = content.match(/Learning Type:\s*([^\n]+)/i);
  const skillMatch = content.match(/Specific Skill:\s*([^\n]+)/i);
  
  // Extract image prompt (paragraph after "Educational Focus Image:")
  const promptMatch = content.match(/\*\*Educational Focus Image:\*\*\s*\n([^\n*]+(?:\n(?!\*\*)[^\n*]+)*)/i);
  
  if (!ageMatch || !typeMatch || !skillMatch || !promptMatch) return null;
  
  return {
    targetAge: ageMatch[1].trim(),
    learningType: typeMatch[1].trim(),
    specificSkill: skillMatch[1].trim(),
    imagePrompt: promptMatch[1].trim()
  };
};

/**
 * Extract book metadata (name and description) from messages
 */
export const getBookMetadata = (messages: any[]): { name: string, description: string } | null => {
  const lastAssistantMsg = [...messages].reverse().find(
    msg => msg.role === 'assistant' && 
    typeof msg.content === 'string' && 
    /\*\*Page\s+\d+:/i.test(msg.content)
  );
  
  if (!lastAssistantMsg || typeof lastAssistantMsg.content !== 'string') {
    return null;
  }
  
  // Extract book name and description from the outline message
  const nameMatch = lastAssistantMsg.content.match(/["']([^"']+)["']/);
  const name = nameMatch ? nameMatch[1] : 'Your Book';
  
  // Look for description in the message
  const descMatch = lastAssistantMsg.content.match(/(?:about|theme|story):\s*([^\n]+)/i);
  const description = descMatch ? descMatch[1] : 'An educational children\'s book';
  
  return { name, description };
};
