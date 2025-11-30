import { PageLayout } from '@/components/layout/PageLayout';
import { AdminOnly } from '@/components/AdminOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Briefcase, Smartphone, Heart, Target, AlertCircle, Radio, Quote } from 'lucide-react';

export default function Personas() {
  return (
    <AdminOnly>
      <PageLayout title="User Personas">
        <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Target Audience Profiles</h2>
            <p className="text-muted-foreground">Marketing personas for Chairlift Habits</p>
          </div>
          
          {/* Connectivity Carol Persona */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">Connectivity Carol</CardTitle>
                  <CardDescription className="text-lg">Primary Target Persona: The Long-Distance Grandma</CardDescription>
                </div>
                <Badge variant="default" className="text-sm px-3 py-1">Primary</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Demographics Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Demographics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Carol Schmidt</p>
                      <p className="text-sm text-muted-foreground">Age 68</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Suburban Ohio</p>
                      <p className="text-sm text-muted-foreground">Kids & grandkids live out of state</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Retired Elementary Teacher</p>
                      <p className="text-sm text-muted-foreground">Career in education</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Moderate Tech Comfort</p>
                      <p className="text-sm text-muted-foreground">Facebook & email daily, cautious with new platforms</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Values Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Core Values
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Family above all', 'Education', 'Making memories', 'Feeling connected', 
                    'Tradition', 'Thoughtful gifts', 'Reading', 'Physical activity'].map((value) => (
                    <Badge key={value} variant="secondary" className="px-3 py-1">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Goals Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Goals
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Maintain a close bond with her grandchildren despite the distance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Be an active participant in their learning and development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Give unique, meaningful gifts that aren't just "stuff"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Share her love of reading with them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Feel appreciated and needed by her kids/grandkids</span>
                  </li>
                </ul>
              </div>

              <Separator />

              {/* Pain Points Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Pain Points
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Misses seeing her grandkids regularly and participating in their daily lives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Struggles to find engaging ways to interact remotely beyond video calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Wants gifts that are both fun and educational, moving beyond popular toys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Worries about screentime, but sees the value of technology for connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Feels a bit nostalgic for "simpler times" and wants to instill classic values like reading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Sometimes feels overwhelmed by too many online gift options</span>
                  </li>
                </ul>
              </div>

              <Separator />

              {/* Media Habits Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Radio className="h-5 w-5 text-primary" />
                  Media Habits
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Online</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span><strong>Facebook</strong> (primary social media)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span><strong>Email newsletters</strong> from groups & stores</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span><strong>Local news</strong> websites</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Offline</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>Local community events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>Church groups</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>Book clubs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>Word-of-mouth from friends</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quote Section */}
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Quote className="h-8 w-8 text-primary flex-shrink-0" />
                  <p className="text-lg italic leading-relaxed">
                    "I just want to feel like I'm still a part of their lives, even if I can't be there every day. 
                    And I really want them to love reading like I do!"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
