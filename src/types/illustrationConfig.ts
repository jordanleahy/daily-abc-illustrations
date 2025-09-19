import { StyleGuideJSON } from './styleGuide';

/**
 * Extended style guide configuration with versioning and tracking
 */
export interface IllustrationConfig extends StyleGuideJSON {
  configVersion: string;
  configHash?: string;
  lastTransformed?: string;
}

/**
 * Configuration with generated human-readable content
 */
export interface IllustrationConfigWithContent {
  config: IllustrationConfig;
  humanReadableContent: string;
  configHash: string;
}

/**
 * Props for illustration config editor component
 */
export interface IllustrationConfigEditorProps {
  config: IllustrationConfig;
  onConfigChange: (config: IllustrationConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}