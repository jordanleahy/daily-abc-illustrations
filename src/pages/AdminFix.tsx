import { AdminExpireFix } from '@/components/AdminExpireFix';
import { PageLayout } from '@/components/layout';

export const AdminFix = () => {
  return (
    <PageLayout title="Admin Fix" showHeader={true} fullHeight={false}>
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <AdminExpireFix />
      </div>
    </PageLayout>
  );
};