import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  bookTitle: string;
  bookTheme: string;
  targetWords: string[];
  reasoning: string;
  educationalBenefit: string;
  estimatedDifficulty: 'easy' | 'medium' | 'challenging';
}

interface WordBookRecommendationsProps {
  kidProfileId: string;
  kidName?: string;
}

export function WordBookRecommendations({ kidProfileId, kidName }: WordBookRecommendationsProps) {
  const navigate = useNavigate();

  const { data: recommendationsData, isLoading, error } = useQuery({
    queryKey: ['word-recommendations', kidProfileId],
    queryFn: async () => {
      console.log('[Recommendations] Fetching for kid:', kidProfileId);
      
      const { data, error } = await supabase.functions.invoke(
        'generate-word-book-recommendations',
        { 
          body: { kidProfileId } 
        }
      );
      
      if (error) {
        console.error('[Recommendations] Error:', error);
        throw error;
      }
      
      console.log('[Recommendations] Received:', data);
      return data;
    },
    // Cache for 1 hour
    staleTime: 1000 * 60 * 60,
  });

  const recommendations = recommendationsData?.recommendations || [];
  const metadata = recommendationsData?.metadata;

  const handleCreateBook = (recommendation: Recommendation) => {
    const prompt = `Create an ABC book about "${recommendation.bookTheme}" that focuses on these words: ${recommendation.targetWords.join(', ')}. 

${recommendation.reasoning}

Make it fun and engaging for kids!`;

    navigate('/google-chat', {
      state: {
        initialPrompt: prompt,
        targetWords: recommendation.targetWords
      }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'challenging': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Book Recommendations
          </CardTitle>
          <CardDescription>
            Analyzing {kidName ? `${kidName}'s` : "your child's"} challenging words...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Book Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load recommendations. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Book Recommendations
          </CardTitle>
          <CardDescription>
            {metadata?.message || "No recommendations yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Keep reading books and marking challenging words! Once we have some data, we'll suggest personalized books to help practice those words.
          </p>
          <Button onClick={() => navigate('/library')} variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Library
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended Practice Books
        </CardTitle>
        <CardDescription>
          Based on {metadata?.totalDifficultWords || 0} challenging words
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {recommendations.map((rec: Recommendation, idx: number) => (
            <Card key={idx} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{rec.bookTitle}</h3>
                  <Badge className={getDifficultyColor(rec.estimatedDifficulty)}>
                    {rec.estimatedDifficulty}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {rec.reasoning}
                </p>
                
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Practice Words:</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.targetWords.slice(0, 8).map((word, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                    {rec.targetWords.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{rec.targetWords.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md mb-4">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">How it helps:</span> {rec.educationalBenefit}
                  </p>
                </div>
                
                <Button 
                  onClick={() => handleCreateBook(rec)}
                  className="w-full"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create This Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
