import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ImageUpload';
import { BitesResultCard } from '@/components/bites/BitesResultCard';
import { BiteCounterGame } from '@/components/bites/BiteCounterGame';
import { ArrowLeft, Loader2, Sparkles, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type ViewState = 'upload' | 'analyzing' | 'results' | 'counting';

interface AnalysisResult {
  originalImage: string;
  portionImage: string | null;
  analysis: {
    foods: Array<{
      name: string;
      plateAmount: string;
      recommendedAmount: string;
      bites: number;
      category: string;
    }>;
    totalBites: number;
    plateDescription: string;
    childAge: number;
    portionPercentage: number;
  };
}

export default function Bites() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [childAge, setChildAge] = useState<string>('4');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage || !imagePreview) {
      toast.error('Please upload a photo of the plate first');
      return;
    }

    setIsAnalyzing(true);
    setViewState('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-bites', {
        body: {
          imageBase64: imagePreview,
          childAge: parseInt(childAge),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setViewState('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze the plate');
      setViewState('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartCounting = () => {
    setViewState('counting');
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setViewState('upload');
  };

  const handleComplete = () => {
    toast.success('Amazing! All bites finished! 🎉');
  };

  return (
    <>
      <Helmet>
        <title>Bites - Portion Guide for Kids | Daily ABC</title>
        <meta name="description" content="AI-powered portion guide to help your child eat the right amount" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => viewState === 'upload' ? navigate(-1) : handleReset()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Bites</h1>
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-6">
          {/* Upload View */}
          {viewState === 'upload' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  🍽️ How much should they eat?
                </h2>
                <p className="text-muted-foreground">
                  Take a photo of the plate and we'll tell you the right portion
                </p>
              </div>

              {/* Image Upload */}
              <Card>
                <CardContent className="pt-6">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    existingImageUrl={imagePreview || undefined}
                  />
                </CardContent>
              </Card>

              {/* Age Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Child's Age</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={childAge} onValueChange={setChildAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i + 2).map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} years old
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Portion sizes are based on USDA guidelines for children
                  </p>
                </CardContent>
              </Card>

              {/* Analyze Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Plate
              </Button>
            </div>
          )}

          {/* Analyzing View */}
          {viewState === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Analyzing the plate...</h3>
              <p className="text-sm text-muted-foreground text-center">
                Identifying foods and calculating portions for a {childAge}-year-old
              </p>
            </div>
          )}

          {/* Results View */}
          {viewState === 'results' && result && (
            <div className="space-y-6 animate-fade-in">
              <BitesResultCard
                originalImage={result.originalImage}
                portionImage={result.portionImage}
                analysis={result.analysis}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Try Another
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleStartCounting}
                >
                  Start Counting Bites
                </Button>
              </div>
            </div>
          )}

          {/* Counting View */}
          {viewState === 'counting' && result && (
            <div className="animate-fade-in">
              <BiteCounterGame
                totalBites={result.analysis.totalBites}
                onComplete={handleComplete}
                onReset={() => setViewState('results')}
              />

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setViewState('results')}
                >
                  Back to Results
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
