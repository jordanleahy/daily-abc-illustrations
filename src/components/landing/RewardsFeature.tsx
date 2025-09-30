import { RewardContainer } from '@/components/ui/reward-container';
import { CoinCounter } from '@/components/ui/coin-counter';
import { Card, CardContent } from '@/components/ui/card';

export const RewardsFeature = () => {
  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            1 Page = 1 Penny
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every book completed earns coins and builds confidence. Track progress and celebrate learning milestones together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          {/* Visual Demo */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="text-6xl font-bold text-primary">
                    $1.24
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Earned this week
                  </p>
                  <RewardContainer earnedRewards={5} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits List */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">🎯 Earn Money</h3>
              <p className="text-muted-foreground">
                Complete books, each money buy bubble team
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">💰Save Money</h3>
              <p className="text-muted-foreground">
                See reading progress and phonics mastery over time
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">🧋 Buy Screen Time & Bubble Tea</h3>
              <p className="text-muted-foreground">
                Build confidence with every milestone reached together
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
