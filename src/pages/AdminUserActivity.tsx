import { useState } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { Header } from '@/components/layout/Header';
import { UserSelector } from '@/components/analytics/UserSelector';
import { ActivitySummaryCards } from '@/components/analytics/ActivitySummaryCards';
import { UserActivityTable } from '@/components/analytics/UserActivityTable';
import { LoadingState } from '@/components/ui/loading-state';
import { useAllUsersWithActivity, useUserReadingActivity } from '@/hooks/useUserActivityAnalytics';
import { BookOpen } from 'lucide-react';

const AdminUserActivity = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { data: users = [], isLoading: isLoadingUsers } = useAllUsersWithActivity();
  const { data: activities = [], isLoading: isLoadingActivities } = useUserReadingActivity(selectedUserId);

  return (
    <AdminOnly>
      <Header title="User Activity Analytics" showQRCode={false} />
      <div className="container mx-auto py-8 space-y-8">
        {isLoadingUsers ? (
          <LoadingState text="Loading users..." />
        ) : (
          <>
            <UserSelector
              users={users}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />

            {selectedUserId && (
              <>
                {isLoadingActivities ? (
                  <LoadingState text="Loading activity..." />
                ) : activities.length > 0 ? (
                  <>
                    <ActivitySummaryCards activities={activities} />
                    <UserActivityTable activities={activities} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
                    <p className="text-muted-foreground max-w-md">
                      This user hasn't accessed any books yet.
                    </p>
                  </div>
                )}
              </>
            )}

            {!selectedUserId && users.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a User</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a user from the dropdown above to view their reading activity and analytics.
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
