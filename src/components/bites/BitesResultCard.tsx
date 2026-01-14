import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FoodItem {
  name: string;
  plateAmount: string;
  recommendedAmount: string;
  bites: number;
  category: string;
  texture?: string;
  confidence?: number;
}

interface BitesAnalysis {
  foods: FoodItem[];
  totalBites: number;
  plateDescription: string;
  childAge: number;
  portionPercentage: number;
  excludedItems?: string[];
  overallConfidence?: number;
}

interface BitesResultCardProps {
  originalImage: string;
  portionImage: string | null;
  analysis: BitesAnalysis;
}

const categoryColors: Record<string, string> = {
  protein: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  grain: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  vegetable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fruit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  dairy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const textureLabels: Record<string, string> = {
  soft: '🥄 Soft',
  medium: '🍗 Medium',
  tough: '🥩 Tough',
  mixed: '🥘 Mixed',
};

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" />
      </span>
    );
  }
  if (confidence >= 0.6) {
    return null; // Medium confidence, no indicator
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="Uncertain identification">
      <AlertCircle className="w-3 h-3" />
    </span>
  );
}

export function BitesResultCard({ originalImage, portionImage, analysis }: BitesResultCardProps) {
  return (
    <div className="space-y-6">
      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📸 Your Plate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img 
                src={originalImage} 
                alt="Original plate" 
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ✅ Portion Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {portionImage ? (
                <img 
                  src={portionImage} 
                  alt="Recommended portion" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-4">
                    <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Eat {analysis.portionPercentage}% of the plate</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Bites Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6 text-center">
          <div className="text-5xl font-bold text-primary mb-1">
            {analysis.totalBites}
          </div>
          <div className="text-lg font-medium text-foreground">
            BITES TOTAL
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Recommended for a {analysis.childAge}-year-old
          </p>
          {analysis.overallConfidence !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              Analysis confidence: {Math.round(analysis.overallConfidence * 100)}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plate Description */}
      {analysis.plateDescription && (
        <p className="text-sm text-muted-foreground text-center italic">
          "{analysis.plateDescription}"
        </p>
      )}

      {/* Food Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Food Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.foods.map((food, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium">{food.name}</span>
                  {food.confidence !== undefined && (
                    <ConfidenceIndicator confidence={food.confidence} />
                  )}
                  <Badge 
                    variant="secondary" 
                    className={categoryColors[food.category] || 'bg-muted text-muted-foreground'}
                  >
                    {food.category}
                  </Badge>
                  {food.texture && (
                    <span className="text-xs text-muted-foreground">
                      {textureLabels[food.texture] || food.texture}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {food.plateAmount} → {food.recommendedAmount}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{food.bites}</div>
                <div className="text-xs text-muted-foreground">bites</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Excluded Items */}
      {analysis.excludedItems && analysis.excludedItems.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Not counted: </span>
              <span className="text-muted-foreground">
                {analysis.excludedItems.join(', ')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 opacity-75">
              Garnishes, condiments, and sauces don't count as bites
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
