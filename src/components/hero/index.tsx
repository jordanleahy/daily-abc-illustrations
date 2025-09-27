import { HeroSpecsOptimized } from './HeroSpecsOptimized';
import { HeroContent } from './HeroContent';
import { HeroSidebar } from './HeroSidebar';
import { DailyContent } from './types';
import { Section } from '@/components/layout/Section';

interface HeroProps {
  content: DailyContent;
  onSave?: (updatedContent: DailyContent) => Promise<void>;
  downloadUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({
  content,
  onSave,
  downloadUrl,
}) => {
  return (
    <Section id="hero" variant="hero">
      <HeroSpecsOptimized
        content={content}
        onSave={onSave || (async () => {})}
        downloadUrl={downloadUrl}
      />
      <HeroContent 
        content={content}
        isEditing={false}
        onUpdateField={() => {}}
      />
    </Section>
  );
};

export type { DailyContent } from './types';