import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout';

const Stories = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <PageLayout title={`Story ${id}`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Story {id}
        </h1>
        <p className="text-muted-foreground">
          Content for story ID: {id}
        </p>
      </div>
    </PageLayout>
  );
};

export default Stories;