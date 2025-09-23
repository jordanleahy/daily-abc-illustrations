import { AdminExpireFix } from '@/components/AdminExpireFix';
import { DirectExpireFix } from '@/components/DirectExpireFix';
import { PageLayout } from '@/components/layout';

export const AdminFix = () => {
  return (
    <PageLayout title="Admin Fix" showHeader={true} fullHeight={false}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <AdminExpireFix />
          <DirectExpireFix />
        </div>
      </div>
    </PageLayout>
  );
};