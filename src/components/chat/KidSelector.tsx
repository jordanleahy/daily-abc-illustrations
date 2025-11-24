import { memo } from 'react';
import { User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { differenceInYears } from 'date-fns';

interface KidSelectorProps {
  selectedKidId: string | null;
  onKidChange: (kidId: string | null) => void;
}

export const KidSelector = memo(({ selectedKidId, onKidChange }: KidSelectorProps) => {
  const { data: kidProfiles = [] } = useKidProfiles();

  if (kidProfiles.length === 0) {
    return null;
  }

  const getKidAge = (dateOfBirth: string | null | undefined) => {
    if (!dateOfBirth) return null;
    const years = differenceInYears(new Date(), new Date(dateOfBirth));
    return years;
  };

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedKidId || 'none'} onValueChange={(value) => onKidChange(value === 'none' ? null : value)}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No child selected</SelectItem>
          {kidProfiles.map((kid) => {
            const age = getKidAge(kid.date_of_birth);
            return (
              <SelectItem key={kid.id} value={kid.id}>
                {kid.first_name} {age ? `(${age}y)` : ''}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
});

KidSelector.displayName = 'KidSelector';
