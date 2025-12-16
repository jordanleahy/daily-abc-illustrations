import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PreviewSection } from './layout/PreviewSection';

interface DeepDiveSectionProps {
  title: string;
  description: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
  imagePosition: 'left' | 'right';
}

export const DeepDiveSection = ({
  title,
  description,
  features,
  ctaText,
  ctaLink,
  imagePosition
}: DeepDiveSectionProps) => {
  const navigate = useNavigate();

  return (
    <PreviewSection variant="feature" className={imagePosition === 'right' ? 'bg-muted/30' : ''}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${imagePosition === 'right' ? '' : ''}`}>
          {/* Text Content */}
          <div className={imagePosition === 'right' ? 'order-1' : 'order-1 md:order-2'}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
            {ctaText && ctaLink && (
              <Button
                variant="outline"
                onClick={() => navigate(ctaLink)}
              >
                {ctaText}
              </Button>
            )}
          </div>

          {/* Image Placeholder */}
          <div className={imagePosition === 'right' ? 'order-2' : 'order-2 md:order-1'}>
            <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
              <span className="text-muted-foreground">Feature visualization</span>
            </div>
          </div>
        </div>
      </div>
    </PreviewSection>
  );
};
