import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Facebook, Twitter, Share2 } from 'lucide-react';

const Stories = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Thumbnails and Main Image */}
          <div className="flex gap-4">
            {/* Thumbnail sidebar */}
            <div className="flex flex-col gap-2 w-20">
              <div className="aspect-square bg-muted rounded-lg border-2 border-primary overflow-hidden">
                <img 
                  src="/lovable-uploads/b29306f4-6cdf-4a40-8f5c-69fa3ddabf60.png" 
                  alt="Thumbnail 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-muted rounded-lg border overflow-hidden">
                <img 
                  src="/lovable-uploads/2b5adcc1-99cb-42b8-8358-958bc6619d30.png" 
                  alt="Thumbnail 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Main gradient area */}
            <div className="flex-1 aspect-video bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl">
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Dora the Explorer A-Z
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-foreground">$FREE</span>
                <span className="text-muted-foreground">Published January 14, 2024</span>
              </div>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Specs */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4 border-b pb-2">
                SPECS
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground">AGE</h4>
                  <p className="text-muted-foreground">PreK - K</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">SUBJECT</h4>
                  <p className="text-muted-foreground">Alphabet, Vocabulary</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">CHARACTERS</h4>
                  <p className="text-muted-foreground">Homeschool, Parents</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="mt-12">
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