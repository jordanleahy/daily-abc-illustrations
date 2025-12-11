import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const TRICKS = [
  '50-50',
  'Frontside 50-50',
  'Frontside 50-50 - BS 180 Out',
  'Frontside 50-50 - BS 360 Out',
  'Frontside 50-50 - FS 180 Out',
  'Frontside 50-50 - FS 360 Out',
  'Backside 50-50',
  'Backside 50-50 - BS 180 Out',
  'Backside 50-50 - BS 360 Out',
  'Backside 50-50 - FS 180 Out',
  'Backside 50-50 - FS 360 Out',
  'Boardslide',
  'Frontside Boardslide',
  'Backside Boardslide',
  'Lipslide',
  'Frontside Lipslide',
  'Backside Lipslide',
  'Noseslide',
  'Tailslide',
  'Bluntslide',
  'Noseblunt',
];

const SHARE_URL = 'https://chairlifthabits.com/snow';
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(SHARE_URL)}`;

const Snow = () => {
  const [currentTrick, setCurrentTrick] = useState<string>(() => {
    const randomIndex = Math.floor(Math.random() * TRICKS.length);
    return TRICKS[randomIndex];
  });

  const handleNext = () => {
    let newTrick = currentTrick;
    // Ensure we don't show the same trick twice in a row
    while (newTrick === currentTrick && TRICKS.length > 1) {
      const randomIndex = Math.floor(Math.random() * TRICKS.length);
      newTrick = TRICKS[randomIndex];
    }
    setCurrentTrick(newTrick);
  };

  return (
    <PageLayout title="Snow" showHeader={false}>
      {/* Share Nav Bar */}
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-center">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="text-center">Share Game of Snow</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col items-center gap-4 p-6 pb-10">
                <img 
                  src={QR_CODE_URL} 
                  alt="QR Code to share Game of Snow" 
                  className="w-48 h-48 rounded-lg"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Scan to open Game of Snow
                </p>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center flex-1 px-4 py-8 min-h-[calc(100vh-200px)]">
        {/* Trick Display */}
        <div className="flex-1 flex items-center justify-center w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-center text-foreground">
            {currentTrick}
          </h1>
        </div>
        
        {/* Next Button */}
        <div className="w-full max-w-md pb-8">
          <Button 
            onClick={handleNext}
            className="w-full h-[168px] text-xl font-semibold"
            size="lg"
          >
            Next
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Snow;
