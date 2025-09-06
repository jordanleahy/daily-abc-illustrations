import { HeroActions } from './HeroActions';
import { format } from 'date-fns';

interface HeroTitleSectionProps {
  title: string;
  price: string;
  downloadUrl: string;
  publishedDate: string;
}

export const HeroTitleSection = ({ title, price, downloadUrl, publishedDate }: HeroTitleSectionProps) => {
  const formattedDate = format(new Date(publishedDate), 'MMMM d, yyyy');
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-xl md:text-2xl font-bold text-foreground mb-2">{price}</p>
        <p className="text-sm text-muted-foreground">Published {formattedDate}</p>
      </div>
      <HeroActions 
        price={price}
        downloadUrl={downloadUrl}
      />
    </div>
  );
};