import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useWordLearningProgress } from '@/hooks/useWordLearningProgress';
import { WordBookRecommendations } from '@/components/recommendations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BookOpen, Brain, Target, Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function WordProgress() {
  const navigate = useNavigate();
  const { data: kidProfiles, isLoading: profilesLoading } = useKidProfiles();
  const [selectedKidId, setSelectedKidId] = useState<string>('');

  // Auto-select first kid if only one exists
  const effectiveKidId = selectedKidId || (kidProfiles?.length === 1 ? kidProfiles[0].id : '');
  const selectedKid = kidProfiles?.find(k => k.id === effectiveKidId);

  const {
    difficultWords,
    allWordProgress,
    wordStats,
  } = useWordLearningProgress(effectiveKidId);

  // Calculate weekly progress (last 7 days)
  const weeklyProgress = useMemo(() => {
    if (!allWordProgress.data) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'yyyy-MM-dd'),
        difficult: 0,
        understood: 0,
      };
    });

    allWordProgress.data.forEach(word => {
      const wordDate = format(new Date(word.marked_at), 'yyyy-MM-dd');
      const dayData = last7Days.find(d => d.fullDate === wordDate);
      if (dayData) {
        if (word.status === 'difficult') dayData.difficult++;
        if (word.status === 'understood') dayData.understood++;
      }
    });

    return last7Days;
  }, [allWordProgress.data]);

  // Pie chart data
  const statusDistribution = useMemo(() => {
    if (!wordStats.data) return [];
    
    return [
      { name: 'Difficult', value: wordStats.data.difficultCount, color: '#ef4444' },
      { name: 'Understood', value: wordStats.data.understoodCount, color: '#22c55e' },
      { name: 'Skipped', value: wordStats.data.skippedCount, color: '#94a3b8' },
    ].filter(item => item.value > 0);
  }, [wordStats.data]);

  // Most recent difficult words
  const recentDifficultWords = useMemo(() => {
    if (!difficultWords.data) return [];
    return difficultWords.data.slice(0, 12);
  }, [difficultWords.data]);

  // Group words by frequency
  const wordFrequency = useMemo(() => {
    if (!difficultWords.data) return [];
    
    const frequency: Record<string, number> = {};
    difficultWords.data.forEach(word => {
      frequency[word.word_text] = (frequency[word.word_text] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }, [difficultWords.data]);

  const isLoading = profilesLoading || wordStats.isLoading || allWordProgress.isLoading;

  if (profilesLoading) {
    return (
      <StandardPageLayout title="Word Learning Progress">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!kidProfiles || kidProfiles.length === 0) {
    return (
      <StandardPageLayout title="Word Learning Progress">
        <div className="mb-4 text-center text-muted-foreground">
          Track vocabulary development and get AI recommendations
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Kid Profiles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a kid profile to start tracking word learning progress
              </p>
              <Button onClick={() => navigate('/profile')}>
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title="Word Learning Progress">
      <div className="mb-6 text-center text-muted-foreground">
        Track vocabulary development and get AI recommendations
      </div>
      <div className="space-y-6">
        {/* Kid Selector */}
        {kidProfiles.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Kid</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={effectiveKidId} onValueChange={setSelectedKidId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a kid profile" />
                </SelectTrigger>
                <SelectContent>
                  {kidProfiles.map((kid) => (
                    <SelectItem key={kid.id} value={kid.id}>
                      {kid.first_name} {kid.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {!effectiveKidId ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please select a kid profile to view progress
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? '...' : wordStats.data?.totalWords || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? '...' : wordStats.data?.uniqueWords || 0} unique
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Challenging</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {isLoading ? '...' : wordStats.data?.difficultCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Need practice
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Understood</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {isLoading ? '...' : wordStats.data?.understoodCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mastered
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !wordStats.data || wordStats.data.totalWords === 0
                      ? '...'
                      : `${Math.round((wordStats.data.understoodCount / wordStats.data.totalWords) * 100)}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Understanding rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Word learning over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklyProgress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyProgress}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="difficult" fill="#ef4444" name="Difficult" />
                        <Bar dataKey="understood" fill="#22c55e" name="Understood" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No activity this week
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Word Status Distribution
                  </CardTitle>
                  <CardDescription>Overall learning progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Most Frequent Challenging Words */}
            {wordFrequency.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Most Frequently Difficult Words</CardTitle>
                  <CardDescription>Words marked as difficult multiple times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {wordFrequency.map((item, index) => (
                      <div key={item.word} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.word}</span>
                        </div>
                        <Badge variant="secondary">
                          {item.count} {item.count === 1 ? 'time' : 'times'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Challenging Words */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Challenging Words</CardTitle>
                <CardDescription>
                  Words recently marked as difficult
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentDifficultWords.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No challenging words yet! Keep reading and mark words that need practice.
                    </p>
                    <Button onClick={() => navigate('/library')} variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Library
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recentDifficultWords.map((word, index) => (
                      <div
                        key={`${word.word_text}-${index}`}
                        className="group relative"
                      >
                        <Badge 
                          variant="outline" 
                          className="cursor-help hover:bg-muted transition-colors"
                        >
                          {word.word_text}
                        </Badge>
                        {word.sentence_context && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border max-w-xs">
                              <p className="italic">"{word.sentence_context}"</p>
                              <p className="text-muted-foreground text-[10px] mt-1">
                                {format(new Date(word.marked_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* AI Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">AI Book Recommendations</h2>
              </div>
              <WordBookRecommendations 
                kidProfileId={effectiveKidId}
                kidName={selectedKid?.first_name}
              />
            </div>
          </>
        )}
      </div>
    </StandardPageLayout>
  );
}
