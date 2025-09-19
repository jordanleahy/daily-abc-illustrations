import { useMemo } from 'react';
import { useSystemPrompt } from './useSystemPrompt';
import { IllustrationConfig, IllustrationConfigWithContent } from '@/types/illustrationConfig';
import { transformConfigToContent } from '@/utils/configTransformer';
import { generateConfigHash, hasConfigChanged } from '@/utils/configHash';

interface UseIllustrationConfigResult {
  config: IllustrationConfig | null;
  content: string | null;
  hasStructuredConfig: boolean;
  isConfigOutdated: boolean;
  isLoading: boolean;
  regenerateContent: (config: IllustrationConfig) => string;
  configHash: string | null;
}

export function useIllustrationConfig(bookId: string): UseIllustrationConfigResult {
  const { 
    currentPrompt, 
    isLoading 
  } = useSystemPrompt(bookId);

  const result = useMemo(() => {
    if (!currentPrompt) {
      return {
        config: null,
        content: null,
        hasStructuredConfig: false,
        isConfigOutdated: false,
        configHash: null
      };
    }

    // Extract config from the prompt metadata
    const illustrationConfig = currentPrompt.generationMetadata?.illustration_config || 
                              (currentPrompt as any).illustration_config;
    
    const storedConfigHash = (currentPrompt as any).config_hash;
    const hasStructuredConfig = !!illustrationConfig;

    // Check if config is outdated
    let isConfigOutdated = false;
    if (illustrationConfig && storedConfigHash) {
      isConfigOutdated = hasConfigChanged(illustrationConfig, storedConfigHash);
    }

    return {
      config: illustrationConfig as IllustrationConfig || null,
      content: currentPrompt.content,
      hasStructuredConfig,
      isConfigOutdated,
      configHash: storedConfigHash || null
    };
  }, [currentPrompt]);

  const regenerateContent = (config: IllustrationConfig): string => {
    return transformConfigToContent(config);
  };

  return {
    ...result,
    isLoading,
    regenerateContent
  };
}