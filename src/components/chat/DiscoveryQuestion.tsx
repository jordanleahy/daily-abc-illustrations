import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscoveryQuestion as DiscoveryQuestionType } from '@/hooks/useDiscoveryFlow';

interface DiscoveryQuestionProps {
  question: DiscoveryQuestionType;
  onAnswer: (questionKey: string, value: string) => void;
  onSkip?: (questionKey: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  className?: string;
}

/**
 * Renders a discovery question with option buttons.
 * Replaces AI-generated [SUGGEST] blocks with direct UI rendering.
 */
export function DiscoveryQuestion({
  question,
  onAnswer,
  onSkip,
  onBack,
  canGoBack = false,
  progress,
  className,
}: DiscoveryQuestionProps) {
  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-3">
        {progress && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {progress.current} of {progress.total}</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
        <CardTitle className="text-lg font-medium leading-relaxed">
          {question.question_text}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Option buttons */}
        <div className="grid gap-2">
          {question.options.map((option) => (
            <Button
              key={option.key}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
              onClick={() => onAnswer(question.question_key, option.key)}
            >
              <span className="text-base">{option.label}</span>
            </Button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          {canGoBack && onBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div /> // Spacer
          )}
          
          {question.is_skippable && onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSkip(question.question_key)}
              className="text-muted-foreground"
            >
              Skip
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline version for chat messages
 */
export function DiscoveryQuestionInline({
  question,
  onAnswer,
  onSkip,
  className,
}: Omit<DiscoveryQuestionProps, 'onBack' | 'canGoBack' | 'progress'>) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-foreground font-medium">{question.question_text}</p>
      
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <Button
            key={option.key}
            variant="secondary"
            size="sm"
            className="h-auto py-2 px-3"
            onClick={() => onAnswer(question.question_key, option.key)}
          >
            {option.label}
          </Button>
        ))}
        
        {question.is_skippable && onSkip && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-2 px-3 text-muted-foreground"
            onClick={() => onSkip(question.question_key)}
          >
            ⏭️ Skip
          </Button>
        )}
      </div>
    </div>
  );
}
