import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserWithActivity } from '@/hooks/useUserActivityAnalytics';
import { formatDistanceToNow } from 'date-fns';

interface UserSelectorProps {
  users: UserWithActivity[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
}

export const UserSelector = ({ users, selectedUserId, onSelectUser }: UserSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.user_name.toLowerCase().includes(query) ||
      (user.user_email && user.user_email.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const selectedUser = users.find(u => u.user_id === selectedUserId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedUserId && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSelectUser(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select value={selectedUserId || ''} onValueChange={onSelectUser}>
        <SelectTrigger>
          <SelectValue placeholder="Select a user to view activity">
            {selectedUser && (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{selectedUser.user_name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedUser.total_books_accessed} books · {selectedUser.total_reading_sessions} sessions
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredUsers.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              <div className="flex flex-col py-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.user_name}</span>
                  {user.user_email && (
                    <span className="text-xs text-muted-foreground">({user.user_email})</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{user.total_books_accessed} books</span>
                  <span>·</span>
                  <span>{user.total_reading_sessions} sessions</span>
                  <span>·</span>
                  <span>
                    {user.last_activity_at 
                      ? formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true })
                      : 'No activity'
                    }
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
