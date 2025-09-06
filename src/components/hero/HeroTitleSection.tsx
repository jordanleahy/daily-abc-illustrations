import { HeroActions } from './HeroActions';

interface HeroTitleSectionProps {
  title: string;
  price: string;
  downloadUrl: string;
}

export const HeroTitleSection = ({ title, price, downloadUrl }: HeroTitleSectionProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-xl md:text-2xl font-bold text-foreground mb-4">{price}</p>
      </div>
      <HeroActions 
        price={price}
        downloadUrl={downloadUrl}
      />
    </div>
  );
};