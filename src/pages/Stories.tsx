import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Facebook, Twitter, Share2 } from 'lucide-react';

const Stories = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Main content area with gradient background */}
        <div className="relative">
          {/* Gradient background */}
          <div className="aspect-video bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl overflow-hidden">
            {/* Content overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Top left thumbnails */}
              <div className="flex gap-2 w-fit">
                <div className="w-16 h-16 bg-white/20 rounded-lg border-2 border-white/40 overflow-hidden">
                  <img 
                    src="/lovable-uploads/b29306f4-6cdf-4a40-8f5c-69fa3ddabf60.png" 
                    alt="Thumbnail 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-lg border border-white/20 overflow-hidden">
                  <img 
                    src="/lovable-uploads/2b5adcc1-99cb-42b8-8358-958bc6619d30.png" 
                    alt="Thumbnail 2"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side content */}
              <div className="absolute right-6 top-6 bottom-6 w-80 text-white">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold">
                    Dora the Explorer A-Z
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">$FREE</span>
                    <span className="text-white/80">Published January 14, 2024</span>
                  </div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  {/* Specs section */}
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-4">
                      SPECS
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-white">AGE</h4>
                        <p className="text-white/80">PreK - K</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">SUBJECT</h4>
                        <p className="text-white/80">Alphabet, Vocabulary</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">CHARACTERS</h4>
                        <p className="text-white/80">Homeschool, Parents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
          <p className="text-muted-foreground text-lg mb-6">
            An A-Z ABC book inspired by Dora the Explorer that turns each letter into a playful learning moment
          </p>
          
          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground mr-4">Share</span>
            <Button variant="outline" size="sm">
              <Facebook className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stories;