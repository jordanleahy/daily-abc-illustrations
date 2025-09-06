import { HeroContent } from './HeroContent';
import { DailyContent } from './types';
import { Section } from '@/components/layout/Section';

interface HeroSectionProps {
  content: DailyContent;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  return (
    <Section id="hero" variant="hero">
      <HeroContent content={content} />
    </Section>
  );
};

export type { DailyContent, HeroSectionProps } from './types';