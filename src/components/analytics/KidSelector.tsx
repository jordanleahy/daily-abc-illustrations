import { useState, useMemo } from 'react';
import { Search, X, Baby } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KidWithActivity } from '@/hooks/useKidActivityAnalytics';
import { formatDistanceToNow, differenceInYears, differenceInMonths } from 'date-fns';

interface KidSelectorProps {
  kids: KidWithActivity[];
  selectedKidId: string | null;
  onSelectKid: (kidId: string | null) => void;
}

const calculateAge = (dateOfBirth: string | null): string => {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  const years = differenceInYears(new Date(), dob);
  const months = differenceInMonths(new Date(), dob) % 12;
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
};

export const KidSelector = ({ kids, selectedKidId, onSelectKid }: KidSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKids = useMemo(() => {
    if (!searchQuery) return kids;
    const query = searchQuery.toLowerCase();
    return kids.filter(kid => 
      kid.kid_name.toLowerCase().includes(query)
    );
  }, [kids, searchQuery]);

  const selectedKid = kids.find(k => k.kid_id === selectedKidId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search kids..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedKidId && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSelectKid(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select value={selectedKidId || ''} onValueChange={onSelectKid}>
        <SelectTrigger>
          <SelectValue placeholder="Select a kid to view reading activity">
            {selectedKid && (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{selectedKid.kid_name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedKid.total_books_read} books · {selectedKid.total_completions} completions
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredKids.length === 0 ? (
            <div className="px-3 py-6 text-center text-muted-foreground">
              <Baby className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No kids found</p>
            </div>
          ) : (
            filteredKids.map((kid) => (
              <SelectItem key={kid.kid_id} value={kid.kid_id}>
                <div className="flex flex-col py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{kid.kid_name}</span>
                    {kid.date_of_birth && (
                      <span className="text-xs text-muted-foreground">
                        ({calculateAge(kid.date_of_birth)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{kid.total_books_read} books</span>
                    <span>·</span>
                    <span>{kid.total_completions} completions</span>
                    <span>·</span>
                    <span>{kid.total_reading_sessions} sessions</span>
                    <span>·</span>
                    <span>
                      {kid.last_activity_at 
                        ? formatDistanceToNow(new Date(kid.last_activity_at), { addSuffix: true })
                        : 'No activity'
                      }
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
