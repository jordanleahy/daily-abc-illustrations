/**
 * Content data structure for daily featured educational materials
 * Used in the hero section to showcase featured books and resources
 */
export interface DailyContent {
  /** Unique identifier for the content item */
  id: string;
  /** Display title of the featured content */
  title: string;
  /** URL of the main promotional image */
  mainImage: string;
  /** Array of thumbnail image URLs for gallery display */
  thumbnails: string[];
  /** Target grade level or age group */
  grade: string;
  /** Educational subjects covered by this content */
  subjects: string[];
  /** Descriptive tags for categorization and search */
  tags: string[];
  /** Detailed description of the content and its educational value */
  description: string;
  /** URL for downloading or accessing the content */
  downloadUrl: string;
  /** Price information (free, premium, subscription) */
  price: string;
  /** ISO date string when the content was published */
  publishedDate: string;
}

/**
 * Props interface for the HeroSection component
 * Defines the required content data for rendering the hero display
 */
export interface HeroSectionProps {
  /** Featured content to display in the hero section */
  content: DailyContent;
}