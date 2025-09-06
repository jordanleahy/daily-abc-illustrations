import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';
import { AdminOnly } from '@/components/AdminOnly';

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
    <div className="flex flex-col sm:flex-row gap-2">
      <AdminOnly>
        <Button 
          onClick={onEditClick}
          variant="outline" 
          size="sm"
          className="gap-2 min-h-[44px]"
        >
          <Edit size={16} />
          Edit Listing
        </Button>
      </AdminOnly>
      
      <Button 
        onClick={handleDownload}
        size="sm"
        className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white min-h-[44px]"
      >
        <Download size={16} />
        Download
      </Button>
    </div>
  );
};