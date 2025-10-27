/**
 * Configuration for text overlay on images
 */
export interface TextOverlayConfig {
  /** Text to display on the image */
  text: string;
  /** Font family name */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold' | '600' | '700' | '800';
  /** Text color (hex format) */
  color: string;
  /** Text stroke color (hex format) */
  strokeColor: string;
  /** Text stroke width in pixels */
  strokeWidth: number;
  /** Shadow color (hex format) */
  shadowColor: string;
  /** Shadow blur radius in pixels */
  shadowBlur: number;
  /** Shadow X offset in pixels */
  shadowOffsetX: number;
  /** Shadow Y offset in pixels */
  shadowOffsetY: number;
  /** Vertical position preset */
  position: 'top' | 'center' | 'bottom' | 'custom';
  /** Y offset as percentage from top (0-100) */
  yOffset: number;
  /** Text alignment */
  align: 'left' | 'center' | 'right';
  /** Whether to show background overlay behind text */
  backgroundOverlay: boolean;
  /** Background overlay opacity (0-1) */
  backgroundOpacity: number;
  /** Padding multiplier for background overlay (0.5 = tight, 1.0 = default, 1.5 = loose) */
  backgroundPaddingMultiplier?: number;
}

/**
 * Default text overlay configuration
 */
export const DEFAULT_TEXT_OVERLAY_CONFIG: TextOverlayConfig = {
  text: '',
  fontFamily: 'Arial',
  fontSize: 72,
  fontWeight: 'bold',
  color: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 4,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 10,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  position: 'bottom',
  yOffset: 85,
  align: 'center',
  backgroundOverlay: true,
  backgroundOpacity: 0.3,
  backgroundPaddingMultiplier: 1.0,
};

/**
 * Available font families
 */
export const AVAILABLE_FONTS = [
  // System fonts
  { name: 'Arial', value: 'Arial' },
  { name: 'Helvetica', value: 'Helvetica' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier', value: 'Courier' },
  { name: 'Verdana', value: 'Verdana' },
  // Google Fonts (loaded dynamically)
  { name: 'Fredoka (Playful)', value: 'Fredoka' },
  { name: 'Bubblegum Sans', value: 'Bubblegum Sans' },
  { name: 'Baloo 2', value: 'Baloo 2' },
  { name: 'Poppins', value: 'Poppins' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Comic Neue', value: 'Comic Neue' },
];

/**
 * Preset text overlay configurations
 */
export const TEXT_OVERLAY_PRESETS: Record<string, Partial<TextOverlayConfig>> = {
  'bold-title': {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 6,
    position: 'bottom',
    yOffset: 85,
    backgroundOverlay: true,
    backgroundOpacity: 0.4,
  },
  'subtle-caption': {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    position: 'top',
    yOffset: 22,
    backgroundOverlay: false,
  },
  'thumbnail-title': {
    fontSize: 80,
    fontWeight: '800',
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 6,
    position: 'top',
    yOffset: 22,
    backgroundOverlay: true,
    backgroundOpacity: 0.5,
  },
  'playful': {
    fontFamily: 'Fredoka',
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFD700',
    strokeColor: '#FF1493',
    strokeWidth: 5,
    position: 'center',
    yOffset: 50,
    backgroundOverlay: false,
  },
  'minimal': {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
    strokeColor: 'transparent',
    strokeWidth: 0,
    shadowBlur: 15,
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    position: 'center',
    yOffset: 50,
    backgroundOverlay: false,
  },
};
