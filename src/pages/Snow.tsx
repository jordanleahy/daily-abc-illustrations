import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';

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
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 min-h-[calc(100vh-200px)]">
        <div className="flex-1 flex items-center justify-center w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-center text-foreground">
            {currentTrick}
          </h1>
        </div>
        
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
