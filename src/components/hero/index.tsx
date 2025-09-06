import { HeroContent } from './HeroContent';
import { DailyContent } from './types';

interface HeroSectionProps {
  content: DailyContent;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  return (
    <section className="w-full min-h-[600px] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroContent content={content} />
      </div>
    </section>
  );
};

export type { DailyContent, HeroSectionProps } from './types';