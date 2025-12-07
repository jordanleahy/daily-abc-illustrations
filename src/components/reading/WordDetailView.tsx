import type { WordMetadata, LetterMetadata } from '@/utils/wordParser';

interface WordDetailViewProps {
  wordData: WordMetadata;
}

/**
 * Displays detailed syllable and letter breakdown for a word
 * Replaces the image area when book icon is clicked
 */
export function WordDetailView({ wordData }: WordDetailViewProps) {
  const {
    word,
    syllableCount,
    segments,
    syllableBreakdown,
    partOfSpeech,
    letters,
  } = wordData;

  return (
    <div className="absolute inset-0 bg-card rounded-lg p-4 flex flex-col overflow-y-auto">
      {/* Word Display */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-foreground capitalize">{word}</h2>
        {partOfSpeech && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            {partOfSpeech}
          </span>
        )}
      </div>

      {/* Syllable Count */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">Syllables:</span>
        <span className="px-2 py-0.5 bg-primary/10 text-primary font-semibold rounded-full text-sm">
          {syllableCount ?? 1}
        </span>
      </div>

      {/* Syllable Segments Visualization */}
      {segments && segments.length > 0 && (
        <div className="flex items-center justify-center gap-1 mb-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center">
              <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-lg">
                {segment}
              </span>
              {index < segments.length - 1 && (
                <span className="mx-1 w-1.5 h-1.5 bg-muted-foreground rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Syllable Breakdown */}
      {syllableBreakdown && (
        <div className="text-center mb-4">
          <span className="text-muted-foreground text-sm">Breakdown: </span>
          <span className="font-mono text-foreground">{syllableBreakdown}</span>
        </div>
      )}

      {/* Letter Breakdown */}
      {letters && letters.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">Letters</h3>
          <div className="space-y-1.5">
            {letters.map((letterData: LetterMetadata, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-background rounded text-xs text-muted-foreground">
                    {letterData.position}
                  </span>
                  <span className="text-xl font-semibold text-foreground uppercase">
                    {letterData.letter}
                  </span>
                </div>
                <span 
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    letterData.isVowel 
                      ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' 
                      : 'bg-coral-500/20 text-coral-600 dark:text-coral-400'
                  }`}
                  style={{
                    backgroundColor: letterData.isVowel ? 'hsl(var(--chart-1) / 0.2)' : 'hsl(var(--chart-2) / 0.2)',
                    color: letterData.isVowel ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))',
                  }}
                >
                  {letterData.isVowel ? 'vowel' : 'consonant'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
