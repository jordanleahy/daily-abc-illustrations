import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UserReadingActivity } from '@/hooks/useUserActivityAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock } from 'lucide-react';

interface UserActivityTableProps {
  activities: UserReadingActivity[];
}

type SortField = 'book_name' | 'kid_name' | 'pages_read' | 'last_viewed_at' | 'view_count';
type SortDirection = 'asc' | 'desc';

export const UserActivityTable = ({ activities }: UserActivityTableProps) => {
  const [selectedKid, setSelectedKid] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_viewed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique kids
  const kids = useMemo(() => {
    const uniqueKids = new Map<string, string>();
    activities.forEach(a => {
      if (a.kid_id && a.kid_name) {
        uniqueKids.set(a.kid_id, a.kid_name);
      }
    });
    return Array.from(uniqueKids.entries()).map(([id, name]) => ({ id, name }));
  }, [activities]);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by kid
    if (selectedKid !== 'all') {
      filtered = filtered.filter(a => a.kid_id === selectedKid);
    }

    // Filter by completion
    if (completionFilter === 'completed') {
      filtered = filtered.filter(a => a.reading_completed);
    } else if (completionFilter === 'in-progress') {
      filtered = filtered.filter(a => !a.reading_completed);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'pages_read') {
        aVal = a.pages_read || 0;
        bVal = b.pages_read || 0;
      }

      if (sortField === 'last_viewed_at') {
        aVal = new Date(a.last_viewed_at).getTime();
        bVal = new Date(b.last_viewed_at).getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [activities, selectedKid, completionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getProgressPercentage = (pagesRead: number | null, totalPages: number | null) => {
    if (!totalPages || !pagesRead) return 0;
    return Math.round((pagesRead / totalPages) * 100);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={selectedKid} onValueChange={setSelectedKid}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Kids" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kids</SelectItem>
            {kids.map(kid => (
              <SelectItem key={kid.id} value={kid.id}>{kid.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={completionFilter} onValueChange={setCompletionFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="text-sm text-muted-foreground flex items-center">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('book_name')}
              >
                Book Name {sortField === 'book_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('kid_name')}
              >
                Kid {sortField === 'kid_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('pages_read')}
              >
                Progress {sortField === 'pages_read' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Completion</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('last_viewed_at')}
              >
                Last Viewed {sortField === 'last_viewed_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('view_count')}
              >
                Sessions {sortField === 'view_count' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No activity found
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => {
                const progressPercent = getProgressPercentage(activity.pages_read, activity.total_pages);
                return (
                  <TableRow key={activity.activity_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{activity.book_name}</div>
                        {activity.book_category && (
                          <div className="text-xs text-muted-foreground">{activity.book_category}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{activity.kid_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[120px]">
                        <div className="text-sm">
                          {activity.pages_read || 0}/{activity.total_pages || 0} pages
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.reading_completed ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {progressPercent}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.last_viewed_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-center">
                      {activity.view_count}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
