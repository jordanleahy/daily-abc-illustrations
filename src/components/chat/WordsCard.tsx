import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";

interface LetterMetadata {
  letter: string;
  position: number;
  isVowel: boolean;
  isConsonant: boolean;
}

interface WordMetadata {
  word: string;
  order: number;
  syllableCount?: number;
  syllableBreakdown?: string;
  partOfSpeech?: string;
  letters?: LetterMetadata[];
}

interface WordsCardProps {
  words?: WordMetadata[];
  title?: string;
  isLoading?: boolean;
}

export function WordsCard({ words, title, isLoading }: WordsCardProps) {
  if (!words || words.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Words
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState text="Analyzing words..." spinnerSize="h-6 w-6" className="py-4" />
        ) : (
          <div className="flex flex-wrap gap-2">
          {words.map((wordData, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-w-[80px]"
            >
              {/* Word Display */}
              <span className="text-lg font-semibold text-foreground mb-2">
                {wordData.word}
              </span>
              
              {/* Letter Breakdown */}
              {wordData.letters && wordData.letters.length > 0 && (
                <div className="flex gap-1">
                  {wordData.letters.map((letter, letterIndex) => (
                    <Badge
                      key={letterIndex}
                      variant="outline"
                      className={`text-xs h-6 w-6 flex items-center justify-center p-0 ${
                        letter.isVowel
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : letter.isConsonant
                          ? 'bg-secondary/10 border-secondary/30 text-secondary-foreground'
                          : 'bg-muted border-border'
                      }`}
                      title={letter.isVowel ? 'Vowel' : letter.isConsonant ? 'Consonant' : ''}
                    >
                      {letter.letter}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Syllable count and part of speech */}
              <div className="flex flex-col items-center gap-1 mt-2">
                {wordData.syllableCount && (
                  <span className="text-xs text-muted-foreground">
                    {wordData.syllableCount} syl
                  </span>
                )}
                {wordData.partOfSpeech && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {wordData.partOfSpeech}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
