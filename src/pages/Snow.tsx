import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { MetaHead } from '@/components/common/MetaHead';
import type { SEOMetadata } from '@/types/openGraph';

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

const seoMetadata: SEOMetadata = {
  title: 'Game of SNOW | Snowboard Trick Generator',
  description: 'Random snowboard trick generator for playing Game of SNOW on the mountain. Get your next trick challenge with one tap!',
  type: 'website',
  url: SHARE_URL,
  siteName: 'Chairlift Habits',
  image: {
    url: 'https://chairlifthabits.com/og-snow.png',
    width: 1200,
    height: 630,
    alt: 'Game of SNOW - Snowboard Trick Generator'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Game of SNOW | Snowboard Trick Generator',
    description: 'Random snowboard trick generator for playing Game of SNOW on the mountain.',
    image: 'https://chairlifthabits.com/og-snow.png'
  },
  keywords: ['snowboard', 'game of snow', 'trick generator', 'snowboarding tricks', 'rail tricks']
};

const Snow = () => {
  const [currentTrick, setCurrentTrick] = useState<string>(() => {
    const randomIndex = Math.floor(Math.random() * TRICKS.length);
    return TRICKS[randomIndex];
  });

  const handleNext = () => {
    let newTrick = currentTrick;
    while (newTrick === currentTrick && TRICKS.length > 1) {
      const randomIndex = Math.floor(Math.random() * TRICKS.length);
      newTrick = TRICKS[randomIndex];
    }
    setCurrentTrick(newTrick);
  };

  return (
    <>
      <MetaHead metadata={seoMetadata} />
      <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Share Nav Bar */}
      <div className="flex-shrink-0 w-full border-b border-border/40 bg-background/95 backdrop-blur">
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
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-6 overflow-hidden">
        {/* Trick Display */}
        <div className="flex-1 flex items-center justify-center w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-center text-foreground">
            {currentTrick}
          </h1>
        </div>
        
        {/* Next Button */}
        <div className="w-full max-w-md flex-shrink-0">
          <Button 
            onClick={handleNext}
            className="w-full h-[168px] text-xl font-semibold"
            size="lg"
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </>
  );
};

export default Snow;
