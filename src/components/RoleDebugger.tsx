import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield } from 'lucide-react';

export const RoleDebugger = () => {
  const { roles, primaryRole, isLoading, error } = useRole();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading roles...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <Shield className="h-4 w-4" />
            Role Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Current User Roles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Primary Role:</span>
            <Badge variant="default">{primaryRole}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">All Roles:</span>
            <div className="flex gap-1 flex-wrap">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};