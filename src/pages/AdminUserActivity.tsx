import { useState } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { Header } from '@/components/layout/Header';
import { KidSelector } from '@/components/analytics/KidSelector';
import { KidActivitySummaryCards } from '@/components/analytics/KidActivitySummaryCards';
import { KidActivityTable } from '@/components/analytics/KidActivityTable';
import { LoadingState } from '@/components/ui/loading-state';
import { useAllKidsWithActivity, useKidReadingActivity } from '@/hooks/useKidActivityAnalytics';
import { Baby } from 'lucide-react';

const AdminUserActivity = () => {
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  const { data: kids = [], isLoading: isLoadingKids } = useAllKidsWithActivity();
  const { data: activities = [], isLoading: isLoadingActivities } = useKidReadingActivity(selectedKidId);

  return (
    <AdminOnly>
      <Header title="Kid Reading Analytics" showQRCode={false} />
      <div className="container mx-auto py-8 space-y-8">
        {isLoadingKids ? (
          <LoadingState text="Loading kids..." />
        ) : (
          <>
            <KidSelector
              kids={kids}
              selectedKidId={selectedKidId}
              onSelectKid={setSelectedKidId}
            />

            {selectedKidId && (
              <>
                {isLoadingActivities ? (
                  <LoadingState text="Loading activity..." />
                ) : activities.length > 0 ? (
                  <>
                    <KidActivitySummaryCards activities={activities} />
                    <KidActivityTable activities={activities} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Baby className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
                    <p className="text-muted-foreground max-w-md">
                      This kid hasn't read any books yet.
                    </p>
                  </div>
                )}
              </>
            )}

            {!selectedKidId && kids.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Baby className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Kid</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a kid from the dropdown above to view their reading activity and analytics.
                </p>
              </div>
            )}

            {kids.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Baby className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Kids Found</h3>
                <p className="text-muted-foreground max-w-md">
                  No kid profiles have been created yet. Reading activity is tracked per kid.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminOnly>
  );
};

export default AdminUserActivity;
