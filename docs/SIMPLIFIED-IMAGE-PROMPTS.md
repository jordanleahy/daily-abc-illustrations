# Simplified Image Prompt System

## Overview
As of this update, the image prompt generation system has been simplified from complex JSON structures to natural language paragraphs.

## Changes Made

### 1. Graphics Designer Agent
**Old Format:** Complex JSON with 10+ nested fields
```json
{
  "subject": {...},
  "scene": {...},
  "style": {...},
  "lighting": {...},
  "composition": {...},
  "colors": {...},
  "educational": {...},
  "technical": {...},
  "safety": {...}
}
```

**New Format:** Simple 2-3 sentence paragraph
```
A fluffy orange cat sitting on a colorful rug, purring contentedly with eyes half-closed. Soft morning sunlight streams through a window behind her. Bright, cheerful toddler storybook illustration style, simple shapes, clean outlines, warm and cozy atmosphere.
```

### 2. Illustration Director Agent
**Old Schema:** Complex nested JSON with metadata, visual elements, composition guidelines, etc.

**New Schema:** Simplified focused JSON
```json
{
  "theme": "One sentence theme",
  "artStyle": "Specific art style",
  "tone": "Visual mood",
  "colorPalette": {
    "primary": { "hex": "#...", "usage": "..." },
    "secondary": { "hex": "#...", "usage": "..." },
    "accent": { "hex": "#...", "usage": "..." },
    "background": { "hex": "#...", "usage": "..." }
  },
  "visualGuidelines": [
    "Simple guideline 1",
    "Simple guideline 2"
  ],
  "characterStyle": "1-2 sentences",
  "environmentStyle": "1-2 sentences"
}
```

### 3. Edge Function Updates
- `generate-page-prompt` now expects and stores simple paragraph format
- Removed JSON parsing logic for page prompts
- Added simple text cleaning (remove code blocks, quotes)
- Metadata now includes `format: 'paragraph'` flag

## Benefits

✅ **Simpler prompts** = Better AI output quality
✅ **Faster generation** = Fewer tokens used (~60% reduction)
✅ **More natural** = Easier to read and manually edit
✅ **Better reliability** = No JSON parsing errors
✅ **Improved results** = AI follows simpler instructions more consistently

## Migration Notes

- **Existing prompts:** Old JSON prompts will continue to work and display normally
- **New prompts:** All newly generated prompts will use the paragraph format
- **No data migration needed:** The system handles both formats transparently
- **Manual editing:** Users can still manually edit prompts as plain text

## Example Workflow

1. User creates a book → Illustration Director generates simplified JSON style guide
2. User clicks "Generate Prompt" on a page → Graphics Designer creates a paragraph
3. System stores the paragraph as plain text in `page_system_prompts.content`
4. Page displays the prompt as a simple, readable paragraph
5. User can copy or edit the prompt easily

## Technical Details

### Agent Instructions
- **Graphics Designer:** Focuses on subject, action, expression, environment, art style
- **Illustration Director:** Provides essential color palette and visual guidelines
- Both enforce the "no text in images" rule

### Database Schema
No changes required - `page_system_prompts.content` stores both formats as TEXT

### UI Components
No changes required - Components display content as text regardless of format

## Future Considerations

- Consider adding a "Convert to Paragraph" button for old JSON prompts
- May want to add formatting options (bullet points, etc.) for readability
- Could add prompt templates for common scenarios
