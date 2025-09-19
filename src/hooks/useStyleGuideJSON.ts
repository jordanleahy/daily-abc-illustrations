/**
 * Hook for working with JSON-structured style guides
 */
import { useMemo } from 'react';
import { StyleGuideJSON, validateStyleGuide } from '@/types/styleGuide';

interface UseStyleGuideJSONProps {
  styleGuideContent?: string;
}

export function useStyleGuideJSON({ styleGuideContent }: UseStyleGuideJSONProps) {
  const parsed = useMemo(() => {
    if (!styleGuideContent) {
      return {
        isValid: false,
        data: null,
        error: 'No style guide content provided',
        isJSON: false,
      };
    }

    try {
      const parsed = JSON.parse(styleGuideContent);
      
      // Check if it's a valid StyleGuideJSON
      if (validateStyleGuide(parsed)) {
        return {
          isValid: true,
          data: parsed as StyleGuideJSON,
          error: null,
          isJSON: true,
        };
      }
      
      // Check if it's an error object (fallback case)
      if (parsed.error === 'JSON_PARSE_FAILED') {
        return {
          isValid: false,
          data: null,
          error: `JSON parsing failed: ${parsed.parseError}`,
          isJSON: false,
          fallbackContent: parsed.fallbackContent,
        };
      }
      
      return {
        isValid: false,
        data: null,
        error: 'Invalid style guide JSON structure',
        isJSON: true,
      };
      
    } catch (parseError) {
      // Not JSON - likely legacy text format
      return {
        isValid: false,
        data: null,
        error: 'Not JSON format (legacy text style guide)',
        isJSON: false,
        fallbackContent: styleGuideContent,
      };
    }
  }, [styleGuideContent]);

  const colorPalette = useMemo(() => {
    if (!parsed.isValid || !parsed.data) return null;
    return parsed.data.colorPalette;
  }, [parsed]);

  const visualElements = useMemo(() => {
    if (!parsed.isValid || !parsed.data) return null;
    return parsed.data.visualElements;
  }, [parsed]);

  const styleRequirements = useMemo(() => {
    if (!parsed.isValid || !parsed.data) return null;
    return parsed.data.styleRequirements;
  }, [parsed]);

  const metadata = useMemo(() => {
    if (!parsed.isValid || !parsed.data) return null;
    return parsed.data.metadata;
  }, [parsed]);

  return {
    ...parsed,
    colorPalette,
    visualElements,
    styleRequirements,
    metadata,
    styleGuide: parsed.data,
  };
}