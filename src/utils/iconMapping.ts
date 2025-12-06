import { LucideIcon, Sparkles, Hash, Shapes, Palette, Music, ArrowLeftRight, Heart, PawPrint, MessageCircle, Moon, BookOpen, Eye, Package } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'Sparkles': Sparkles,
  'Hash': Hash,
  'Shapes': Shapes,
  'Palette': Palette,
  'Music': Music,
  'ArrowLeftRight': ArrowLeftRight,
  'Heart': Heart,
  'PawPrint': PawPrint,
  'MessageCircle': MessageCircle,
  'Moon': Moon,
  'BookOpen': BookOpen,
  'Eye': Eye,
  'Package': Package,
};

/**
 * Maps a string icon name to a Lucide React component.
 * Falls back to Package icon if name not found.
 */
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Package;
}

/**
 * Get all available icon names for the admin UI selector.
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(ICON_MAP);
}
