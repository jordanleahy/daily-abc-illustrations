import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';

interface HeroActionsProps {
  price: string;
  downloadUrl: string;
  onEditClick?: () => void;
}

export const HeroActions = ({ price, downloadUrl, onEditClick }: HeroActionsProps) => {
  const handleDownload = () => {
    // Handle download logic
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={onEditClick}
        variant="outline" 
        size="sm"
        className="gap-2"
      >
        <Edit size={16} />
        Edit Listing
      </Button>
      
      <Button 
        onClick={handleDownload}
        size="sm"
        className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        <Download size={16} />
        Download
      </Button>
    </div>
  );
};