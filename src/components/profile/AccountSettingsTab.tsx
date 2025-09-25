import { Button } from '@/components/ui/button';
import { Shield, Key, Trash2 } from 'lucide-react';

export function AccountSettingsTab() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Key className="h-3 w-3" />
          Security
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div>
              <p className="font-medium text-sm">Password</p>
              <p className="text-xs text-muted-foreground">Last updated 30 days ago</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Change
              <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div>
              <p className="font-medium text-sm">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Extra security layer</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Enable
              <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Shield className="h-3 w-3" />
          Privacy
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div>
              <p className="font-medium text-sm">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Account updates & features</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Manage
              <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div>
              <p className="font-medium text-sm">Data Export</p>
              <p className="text-xs text-muted-foreground">Download account data</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Export
              <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <Trash2 className="h-3 w-3" />
          Danger Zone
        </div>
        <div className="flex items-center justify-between p-2 rounded-md border border-destructive/20 bg-destructive/5">
          <div>
            <p className="font-medium text-sm">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete all data</p>
          </div>
          <Button variant="destructive" size="sm" disabled>
            Delete
            <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}