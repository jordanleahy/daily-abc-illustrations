/**
 * Unified prompt sanitization for image generation
 * 
 * This utility removes instructional metadata from AI-generated prompts,
 * leaving only the pure scene description for image generation.
 * 
 * Applied at extraction time so prompts stored in qa_page_prompts are clean.
 * This ensures "Copy Prompt" and "Generate" use identical prompts.
 * 
 * Server-side contextual enhancements (aspect ratio, cover title, negative prompts)
 * are added separately in the edge function.
 */

export function sanitizeImagePrompt(prompt: string): string {
  if (!prompt) return '';
  
  let clean = prompt;
  
  // Remove JSON metadata prefix: [pageType: "cover", pageNumber: 0]
  clean = clean.replace(/^\[pageType:\s*"[^"]*",\s*pageNumber:\s*\d+\]\s*/gi, '');
  
  // Remove pagetype metadata at the beginning
  clean = clean.replace(/^pagetype:\s*"[^"]*"\s*/gi, '');
  
  // Remove page headers: **Page N: Title**, **Cover: Title**, **Educational Focus: Title**
  clean = clean.replace(/^\*\*(?:Page\s+\d+|Cover|Educational Focus):[^\n*]*\*\*\s*/gim, '');
  
  // Remove **Text Overlay:** section and its content (until next ** or end)
  clean = clean.replace(/\*\*Text Overlay:\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove **Rhyme Text:** section and its content
  clean = clean.replace(/\*\*Rhyme Text:\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove **Rhyme Pair:** lines
  clean = clean.replace(/\*\*Rhyme Pair:\*\*[^\n]*\n?/gi, '');
  
  // Remove bullet-format Text Overlay lines (entire line including quoted content)
  clean = clean.replace(/^-\s*\*{0,2}Text Overlay\*{0,2}:\s*[^\n]*\n?/gim, '');
  
  // Remove bullet-format Opposite Pair lines (entire line)
  clean = clean.replace(/^-\s*\*{0,2}Opposite Pair\*{0,2}:\s*[^\n]*\n?/gim, '');
  
  // Remove any remaining "Text Overlay" references with quoted content
  clean = clean.replace(/\bText Overlay\b[:\s]*["'][^"']*["']/gi, '');
  
  // Remove character metadata sections: **Paw Patrol Character(s):** etc.
  clean = clean.replace(/\*\*(?:Paw Patrol |Disney |Frozen |Peppa Pig |Bluey |Cocomelon |Moana |Mickey Mouse |Mario |Sesame Street |)Character\(?s?\)?:\*\*[^\n]*\n?/gi, '');
  
  // Remove **Educational Content:** and **Activity:** sections
  clean = clean.replace(/\*\*Educational Content:\*\*[\s\S]*?(?=\n\*\*|$)/gi, '');
  clean = clean.replace(/\*\*Activity:\*\*[\s\S]*?(?=\n\*\*|$)/gi, '');
  
  // Remove **Illustration:** or **Image Prompt:** labels but keep content
  clean = clean.replace(/\*\*(?:Illustration|Image Prompt):\*\*\s*/gi, '');
  
  // Remove DISPLAY TITLE instructions and everything after
  clean = clean.replace(/\n*DISPLAY TITLE:[\s\S]*$/gi, '');
  
  // Remove standalone quoted text lines (rhymes in quotes)
  clean = clean.replace(/^[""][^""]+[""]\.?\s*$/gm, '');
  
  // Remove bullet point markers at start of lines
  clean = clean.replace(/^[-*]\s+/gm, '');
  
  // Clean up extra whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  
  return clean;
}
