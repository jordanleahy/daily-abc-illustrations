import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { KidReadingActivity } from '@/hooks/useKidActivityAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, ArrowUpDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KidActivityTableProps {
  activities: KidReadingActivity[];
}

type SortField = 'book_name' | 'pages_read' | 'completion_count' | 'last_viewed_at' | 'view_count';
type SortDirection = 'asc' | 'desc';

export const KidActivityTable = ({ activities }: KidActivityTableProps) => {
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_viewed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredActivities = useMemo(() => {
    let filtered = [...activities];
    
    // Filter by completion
    if (completionFilter === 'completed') {
      filtered = filtered.filter(a => a.reading_completed);
    } else if (completionFilter === 'in_progress') {
      filtered = filtered.filter(a => !a.reading_completed);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'book_name':
          comparison = a.book_name.localeCompare(b.book_name);
          break;
        case 'pages_read':
          comparison = (a.pages_read || 0) - (b.pages_read || 0);
          break;
        case 'completion_count':
          comparison = (a.completion_count || 0) - (b.completion_count || 0);
          break;
        case 'last_viewed_at':
          comparison = new Date(a.last_viewed_at).getTime() - new Date(b.last_viewed_at).getTime();
          break;
        case 'view_count':
          comparison = a.view_count - b.view_count;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [activities, completionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getProgressPercentage = (pagesRead: number | null, totalPages: number | null): number => {
    if (!pagesRead || !totalPages || totalPages === 0) return 0;
    return Math.min(100, Math.round((pagesRead / totalPages) * 100));
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No reading activity found for this kid.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Reading Activity</h3>
        <div className="flex items-center gap-4">
          <Select value={completionFilter} onValueChange={setCompletionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="book_name">Book</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="pages_read">Progress</SortableHeader>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <SortableHeader field="completion_count">Completions</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="last_viewed_at">Last Read</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="view_count">Sessions</SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivities.map((activity) => (
            <TableRow key={activity.activity_id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{activity.book_name}</span>
                  {activity.book_category && (
                    <span className="text-xs text-muted-foreground">{activity.book_category}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <div className="flex items-center justify-between text-xs">
                    <span>{activity.pages_read || 0}/{activity.total_pages || 0}</span>
                    <span>{getProgressPercentage(activity.pages_read, activity.total_pages)}%</span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(activity.pages_read, activity.total_pages)} 
                    className="h-2"
                  />
                </div>
              </TableCell>
              <TableCell>
                {activity.reading_completed ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3 text-muted-foreground" />
                  <span>{activity.completion_count || 0}×</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.last_viewed_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium">{activity.view_count}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
