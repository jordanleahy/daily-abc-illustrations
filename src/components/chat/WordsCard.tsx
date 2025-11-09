import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

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
}

export function WordsCard({ words, title }: WordsCardProps) {
  if (!words || words.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Words Analysis
          {title && <span className="text-xs text-muted-foreground font-normal ml-2">from "{title}"</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {words.map((wordData, index) => (
          <div
            key={index}
            className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 space-y-2">
              {/* Word Display */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-foreground">
                  {wordData.word}
                </span>
                {wordData.partOfSpeech && (
                  <Badge variant="secondary" className="text-xs">
                    {wordData.partOfSpeech}
                  </Badge>
                )}
              </div>
              
              {/* Syllable Info */}
              {wordData.syllableCount && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {wordData.syllableCount} syllable{wordData.syllableCount !== 1 ? 's' : ''}
                  </span>
                  {wordData.syllableBreakdown && wordData.syllableBreakdown !== wordData.word.toLowerCase() && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono text-muted-foreground">
                        {wordData.syllableBreakdown}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {/* Letter Breakdown */}
              {wordData.letters && wordData.letters.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {wordData.letters.map((letter, letterIndex) => (
                    <Badge
                      key={letterIndex}
                      variant="outline"
                      className={`text-xs ${
                        letter.isVowel
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : letter.isConsonant
                          ? 'bg-secondary/10 border-secondary/30 text-secondary-foreground'
                          : 'bg-muted border-border'
                      }`}
                    >
                      {letter.letter}
                      <span className="ml-1 text-[10px] opacity-60">
                        {letter.isVowel ? 'V' : letter.isConsonant ? 'C' : ''}
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Summary Stats */}
        <div className="pt-2 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
          <span>Total Words: {words.length}</span>
          <span>
            Total Syllables: {words.reduce((sum, w) => sum + (w.syllableCount || 0), 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
