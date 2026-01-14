import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { UtensilsCrossed } from 'lucide-react';

interface FoodItem {
  name: string;
  plateAmount: string;
  recommendedAmount: string;
  bites: number;
  category: string;
}

interface BitesAnalysis {
  foods: FoodItem[];
  totalBites: number;
  plateDescription: string;
  childAge: number;
  portionPercentage: number;
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
  pizza: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{food.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={categoryColors[food.category] || categoryColors.other}
                  >
                    {food.category}
                  </Badge>
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
    </div>
  );
}
