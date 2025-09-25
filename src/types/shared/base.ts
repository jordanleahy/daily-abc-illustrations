/**
 * Base interfaces and utility types for consistent patterns across the application
 */

/**
 * Base component props that most components should extend
 */
export interface BaseComponentProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Interactive component props for buttons, links, etc.
 */
export interface InteractiveProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Form-related props for consistent form handling
 */
export interface FormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
}

/**
 * Modal/Dialog props for consistent modal patterns
 */
export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Version tracking interface for entities with version history
 */
export interface VersionTracked {
  version_number: number;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Deployment tracking interface for deployable entities
 */
export interface DeploymentTracked {
  is_deployed: boolean;
  deployed_at: string | null;
}

/**
 * User ownership tracking interface
 */
export interface UserOwned {
  user_id: string;
}

/**
 * Generic utility type for adding version history to any type
 */
export type WithVersionHistory<T> = T & VersionTracked;

/**
 * Generic utility type for making specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Generic utility type for making specific properties nullable
 */
export type Nullable<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

/**
 * ID-based entity interface
 */
export interface Entity {
  id: string;
}

/**
 * Timestamped entity interface
 */
export interface Timestamped {
  created_at: string;
  updated_at: string;
}

/**
 * Complete base entity combining common patterns
 */
export interface BaseEntity extends Entity, Timestamped, UserOwned {}