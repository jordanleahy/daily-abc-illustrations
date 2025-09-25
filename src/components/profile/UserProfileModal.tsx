import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ProfileInfoTab } from './ProfileInfoTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { SubscriptionTab } from './SubscriptionTab';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'profile' | 'account' | 'subscription';

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile Info', component: ProfileInfoTab },
    { id: 'account', label: 'Account Settings', component: AccountSettingsTab },
    { id: 'subscription', label: 'Subscription', component: SubscriptionTab },
  ] as const;

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileInfoTab;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">Profile Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-muted/30 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-left text-xs"
                  onClick={() => setActiveTab(tab.id as TabType)}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          <Separator orientation="vertical" className="hidden md:block" />

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <ActiveComponent />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}