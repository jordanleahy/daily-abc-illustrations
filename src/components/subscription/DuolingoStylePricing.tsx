import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Crown, Zap, Star, Gift, Target, Trophy, Heart, Flame } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";

export const DuolingoStylePricing = () => {
  const { createCheckoutSession, isSubscribed, getSubscriptionTier, loading } = useSubscription();
  const currentTier = getSubscriptionTier();

  const freeFeatures = [
    { text: "Daily ABC adventures", icon: "📚", locked: false },
    { text: "Basic learning streak", icon: "🔥", locked: false },
    { text: "Limited story access", icon: "📖", locked: false },
  ];

  const premiumFeatures = [
    { text: "Unlimited learning streaks", icon: "🔥", benefit: "Never lose momentum!" },
    { text: "All story collections", icon: "📚", benefit: "200+ premium books" },
    { text: "Mistake-free learning", icon: "❌", benefit: "No ads interrupting" },
    { text: "Offline mode", icon: "📱", benefit: "Learn anywhere" },
    { text: "Progress insights", icon: "📊", benefit: "Track your growth" },
    { text: "Priority support", icon: "🎯", benefit: "Get help instantly" },
  ];

  const testimonials = [
    { name: "Sarah M.", text: "My kids love their daily ABC time! The stories are so engaging.", streak: 47 },
    { name: "Mike D.", text: "Perfect for homeschooling. Worth every penny!", streak: 89 },
    { name: "Lisa K.", text: "The progress tracking helps me see how much they've learned.", streak: 23 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-duolingo-green/10 via-background to-duolingo-orange/10">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-duolingo-green to-duolingo-green-light rounded-full flex items-center justify-center text-4xl animate-bounce">
                📚
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-duolingo-orange rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-duolingo-green to-duolingo-blue bg-clip-text text-transparent">
            Supercharge Your Learning
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join millions of families creating magical ABC moments every day
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-duolingo-green">500K+</div>
              <div className="text-sm text-muted-foreground">Happy Families</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-duolingo-orange">2M+</div>
              <div className="text-sm text-muted-foreground">Books Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-duolingo-purple">365</div>
              <div className="text-sm text-muted-foreground">Days of Fun</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Progress (for existing users) */}
      {isSubscribed && (
        <div className="max-w-2xl mx-auto px-4 mb-12">
          <Card className="bg-gradient-to-r from-duolingo-green/10 to-duolingo-blue/10 border-duolingo-green/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-duolingo-orange rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">You're on fire! 🔥</h3>
                  <p className="text-muted-foreground">Keep your learning streak alive</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily goal progress</span>
                  <span className="font-medium">7/10 stories</span>
                </div>
                <Progress value={70} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Free Plan */}
          <Card className="relative border-2 border-muted hover:border-duolingo-green/30 transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Free Learner</CardTitle>
              <CardDescription>Perfect to get started</CardDescription>
              <div className="text-4xl font-bold mt-4">
                $0<span className="text-lg font-normal text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-duolingo-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-duolingo-green" />
                    </div>
                    <span className="text-sm">{feature.icon} {feature.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  ✨ Already amazing, but there's so much more...
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Monthly Plan */}
          <Card className={`relative transform scale-105 border-2 ${currentTier?.interval === 'month' ? 'border-duolingo-green ring-4 ring-duolingo-green/20' : 'border-duolingo-green'} shadow-xl`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-duolingo-orange text-white px-4 py-1 text-sm font-bold">
                <Zap className="w-4 h-4 mr-1" />
                MOST POPULAR
              </Badge>
            </div>
            {currentTier?.interval === 'month' && (
              <Badge className="absolute top-4 right-4 bg-duolingo-green text-white">
                <Crown className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
            )}
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-duolingo-green to-duolingo-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Super Learner</CardTitle>
              <CardDescription>Unlock your full potential</CardDescription>
              <div className="text-4xl font-bold mt-4 text-duolingo-green">
                $19.99<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-duolingo-green/10 text-duolingo-green px-3 py-1 rounded-full text-sm font-medium">
                  <Gift className="w-4 h-4" />
                  Everything in Free, plus:
                </div>
              </div>
              <ul className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-duolingo-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{feature.icon} {feature.text}</div>
                      <div className="text-xs text-duolingo-green font-medium">{feature.benefit}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-duolingo-green to-duolingo-green-light hover:opacity-90 text-white font-bold py-3 text-lg shadow-lg"
                onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.standard_monthly.price_id)}
                disabled={loading || (isSubscribed && currentTier?.interval === 'month')}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : currentTier?.interval === 'month' ? (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Current Plan
                  </span>
                ) : isSubscribed ? "Switch to Monthly" : (
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Start Learning
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Annual Plan */}
          <Card className={`relative border-2 ${currentTier?.interval === 'year' ? 'border-duolingo-purple ring-4 ring-duolingo-purple/20' : 'border-duolingo-purple'} hover:border-duolingo-purple/70 transition-all duration-300`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-duolingo-purple to-purple-600 text-white px-4 py-1 text-sm font-bold">
                <Trophy className="w-4 h-4 mr-1" />
                BEST VALUE
              </Badge>
            </div>
            {currentTier?.interval === 'year' && (
              <Badge className="absolute top-4 right-4 bg-duolingo-purple text-white">
                <Crown className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
            )}
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-duolingo-purple to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Master Learner</CardTitle>
              <CardDescription>The ultimate learning experience</CardDescription>
              <div className="text-4xl font-bold mt-4 text-duolingo-purple">
                $29.99<span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-duolingo-yellow/20 text-duolingo-yellow px-3 py-1 rounded-full text-sm font-bold">
                  Save $89.89 (75% off!)
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-duolingo-purple/10 text-duolingo-purple px-3 py-1 rounded-full text-sm font-medium">
                  <Crown className="w-4 h-4" />
                  Everything in Super, plus:
                </div>
              </div>
              <ul className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-duolingo-purple rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{feature.icon} {feature.text}</div>
                      <div className="text-xs text-duolingo-purple font-medium">{feature.benefit}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-duolingo-purple/5 rounded-lg border border-duolingo-purple/20">
                <div className="flex items-center gap-2 text-sm font-medium text-duolingo-purple">
                  <Gift className="w-4 h-4" />
                  <span>Bonus: Family sharing for up to 6 members!</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-duolingo-purple to-purple-600 hover:opacity-90 text-white font-bold py-3 text-lg shadow-lg" 
                onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.standard_annual.price_id)}
                disabled={loading || (isSubscribed && currentTier?.interval === 'year')}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : currentTier?.interval === 'year' ? (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Current Plan
                  </span>
                ) : isSubscribed ? "Switch to Annual" : (
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Become a Master
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Social Proof */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-12">
            Join happy families worldwide! 🌟
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-duolingo-green/5 to-duolingo-blue/5 border-duolingo-green/20 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-duolingo-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="flex items-center gap-1 text-xs text-duolingo-orange">
                        <Flame className="w-3 h-3" />
                        {testimonial.streak} day streak
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
                  <div className="flex mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-duolingo-yellow text-duolingo-yellow" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription Management */}
        {isSubscribed && (
          <div className="text-center mt-16 p-8 bg-muted/50 rounded-2xl">
            <Target className="w-12 h-12 text-duolingo-green mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">You're all set! 🎉</h3>
            <p className="text-muted-foreground mb-6">
              Need to update your billing information or make changes to your subscription?
            </p>
            <Button 
              variant="outline" 
              className="border-duolingo-green text-duolingo-green hover:bg-duolingo-green hover:text-white"
              onClick={() => window.open('/subscription/manage', '_blank')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        )}

        {/* Money-back guarantee */}
        <div className="text-center mt-12 p-6 bg-duolingo-green/5 rounded-2xl border border-duolingo-green/20">
          <div className="w-16 h-16 bg-duolingo-green rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-bold mb-2">30-Day Money-Back Guarantee</h4>
          <p className="text-sm text-muted-foreground">
            Not happy? Get a full refund within 30 days, no questions asked. We're confident you'll love it! ✨
          </p>
        </div>
      </div>
    </div>
  );
};