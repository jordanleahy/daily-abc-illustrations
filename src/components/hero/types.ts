export interface DailyContent {
  id: string;
  title: string;
  mainImage: string;
  thumbnails: string[];
  grade: string;
  subjects: string[];
  tags: string[];
  description: string;
  downloadUrl: string;
  price: string;
}

export interface HeroSectionProps {
  content: DailyContent;
}