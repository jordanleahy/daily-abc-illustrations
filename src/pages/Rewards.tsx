import { useState } from 'react';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useAuth } from '@/hooks/useAuth';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, BookOpen, Star } from 'lucide-react';
import { RewardContainer } from '@/components/ui/reward-container';
import { CoinCounter } from '@/components/ui/coin-counter';

export default function Rewards() {
  const { user, loading: authLoading } = useAuth();
  const { data: kidProfiles, isLoading } = useKidProfiles();
  const [selectedKidId, setSelectedKidId] = useState<string>('');

  // Redirect if not authenticated
  if (authLoading) {
    return <LoadingState text="Loading..." />;
  }

  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view rewards.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isLoading) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading rewards..." />
      </StandardPageLayout>
    );
  }

  if (!kidProfiles || kidProfiles.length === 0) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Kids Added Yet</h2>
          <p className="text-muted-foreground">
            Add your kids in the profile section to start tracking their reading rewards!
          </p>
        </div>
      </StandardPageLayout>
    );
  }

  // Auto-select first kid if none selected
  const currentKid = selectedKidId 
    ? kidProfiles.find(kid => kid.id === selectedKidId)
    : kidProfiles[0];

  if (!currentKid && !selectedKidId && kidProfiles.length > 0) {
    setSelectedKidId(kidProfiles[0].id);
  }

  return (
    <StandardPageLayout>
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reading Rewards</h1>
          <p className="text-muted-foreground">
            Track your reading progress and collect coins!
          </p>
        </div>

        {kidProfiles.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Select Kid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedKidId || kidProfiles[0]?.id} onValueChange={setSelectedKidId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a kid to view rewards" />
                </SelectTrigger>
                <SelectContent>
                  {kidProfiles.map((kid) => (
                    <SelectItem key={kid.id} value={kid.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={kid.profile_image_url} />
                          <AvatarFallback>
                            {kid.first_name[0]}{kid.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {kid.first_name} {kid.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {currentKid && (
          <div className="space-y-6">
            {/* Kid Info & Coin Balance */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentKid.profile_image_url} />
                      <AvatarFallback className="text-xl">
                        {currentKid.first_name[0]}{currentKid.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {currentKid.first_name} {currentKid.last_name}
                      </h2>
                      <p className="text-muted-foreground">Reading Champion</p>
                    </div>
                  </div>
                  <CoinCounter coins={currentKid.earned_coins || 0} size="md" />
                </div>
              </CardContent>
            </Card>

            {/* Coin Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Earned Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentKid.earned_coins > 0 ? (
                  <RewardContainer 
                    earnedRewards={currentKid.earned_coins} 
                    className="bg-muted/50 rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Reading to Earn Coins!</h3>
                    <p className="text-muted-foreground">
                      Read ABC books to start collecting your first coins.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Encouragement */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Keep Reading!</h3>
                  <p className="text-muted-foreground">
                    Every page you read earns you more coins. 
                    Visit the daily books to continue your reading adventure!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}