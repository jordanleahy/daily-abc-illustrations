// Manners-specific environment constants
// These are simplified environments for teaching manners (home/school only)

export const VALID_MANNERS_ENVIRONMENTS = ['home', 'school'] as const;
export type ValidMannersEnvironment = typeof VALID_MANNERS_ENVIRONMENTS[number];

export interface MannersEnvironmentOption {
  id: ValidMannersEnvironment;
  label: string;
  emoji: string;
  description: string;
}

// Static manners environment options
export const MANNERS_ENVIRONMENT_OPTIONS: MannersEnvironmentOption[] = [
  { id: 'home', label: 'Home', emoji: '🏠', description: 'Kitchen, dining room, family settings' },
  { id: 'school', label: 'School', emoji: '🏫', description: 'Cafeteria, classroom, playground' },
];

/**
 * Type guard for valid manners environment IDs
 */
export function isValidMannersEnvironment(value: string): value is ValidMannersEnvironment {
  return VALID_MANNERS_ENVIRONMENTS.includes(value.toLowerCase() as ValidMannersEnvironment);
}

/**
 * Get manners environment label for display
 */
export function getMannersEnvironmentLabel(envId: ValidMannersEnvironment): string {
  const option = MANNERS_ENVIRONMENT_OPTIONS.find(e => e.id === envId);
  return option?.label || envId;
}

/**
 * Get manners environment with emoji for display
 */
export function getMannersEnvironmentDisplay(envId: ValidMannersEnvironment): string {
  const option = MANNERS_ENVIRONMENT_OPTIONS.find(e => e.id === envId.toLowerCase() as ValidMannersEnvironment);
  return option ? `${option.emoji} ${option.label}` : envId;
}

/**
 * Get the suggest block for manners environment selection
 */
export function getMannersEnvironmentSuggestBlock(): string {
  return MANNERS_ENVIRONMENT_OPTIONS
    .map(env => `${env.id}: ${env.emoji} ${env.label}`)
    .join('\n');
}
