import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { HeroSection, DailyContent } from '@/components/hero';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  // Sample data - this would come from your daily content API/database
  const dailyContent: DailyContent = {
    id: '1',
    title: 'Dora the Explorer A-Z',
    mainImage: '/lovable-uploads/b29306f4-6cdf-4a40-8f5c-69fa3ddabf60.png',
    thumbnails: [
      '/lovable-uploads/b29306f4-6cdf-4a40-8f5c-69fa3ddabf60.png',
      '/lovable-uploads/2b5adcc1-99cb-42b8-8358-958bc6619d30.png',
    ],
    grade: 'PreK - K',
    subjects: ['Alphabet', 'Vocabulary'],
    tags: ['Homeschool', 'Parents'],
    description: 'An A-Z ABC book inspired by Dora the Explorer that turns each letter into a playful learning moment',
    downloadUrl: '#',
    price: '$FREE'
  };

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <div className="min-h-screen">
          <HeroSection content={dailyContent} />
        </div>
      </Container>
    </PageLayout>
  );
};

export default Index;
