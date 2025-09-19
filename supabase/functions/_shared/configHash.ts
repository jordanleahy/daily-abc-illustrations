/**
 * Generate a deterministic hash for illustration config to detect changes
 * Shared utility for edge functions
 */

interface IllustrationConfig {
  [key: string]: any;
  configHash?: string;
  lastTransformed?: string;
}

export function generateConfigHash(config: IllustrationConfig): string {
  // Create a stable string representation of the config
  const configCopy = { ...config };
  // Remove volatile fields that shouldn't affect the hash
  delete configCopy.configHash;
  delete configCopy.lastTransformed;
  
  // Sort keys for deterministic stringification
  const configString = JSON.stringify(configCopy, Object.keys(configCopy).sort());
  
  // Create a simple hash (for production, consider using a proper hashing library)
  let hash = 0;
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base36 for shorter representation
  return Math.abs(hash).toString(36).substring(0, 12);
}

/**
 * Check if config has changed by comparing hashes
 */
export function hasConfigChanged(config: IllustrationConfig, storedHash?: string): boolean {
  if (!storedHash) return true;
  return generateConfigHash(config) !== storedHash;
}