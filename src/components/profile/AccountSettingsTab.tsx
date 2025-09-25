import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Key, Trash2 } from 'lucide-react';

export function AccountSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account security and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password & Security
          </CardTitle>
          <CardDescription>
            Update your password and manage security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last updated 30 days ago
              </p>
            </div>
            <Button variant="outline" disabled>
              Change Password
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about your account and new features
              </p>
            </div>
            <Button variant="outline" disabled>
              Manage
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of your account data
              </p>
            </div>
            <Button variant="outline" disabled>
              Export Data
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}