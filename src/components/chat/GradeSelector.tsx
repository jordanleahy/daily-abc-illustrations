import { memo } from 'react';
import { GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGradeLevels } from '@/hooks/useGradeLevels';
import type { GradeId } from '@/types/grade';

interface GradeSelectorProps {
  selectedGradeId: GradeId | null;
  onGradeChange: (gradeId: GradeId | null) => void;
}

export const GradeSelector = memo(({ selectedGradeId, onGradeChange }: GradeSelectorProps) => {
  const { data: gradeLevels = [], isLoading } = useGradeLevels();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <div className="h-9 w-[140px] animate-pulse bg-muted rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={selectedGradeId || 'none'} 
        onValueChange={(value) => onGradeChange(value === 'none' ? null : value as GradeId)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All grades</SelectItem>
          {gradeLevels.map((grade) => (
            <SelectItem key={grade.id} value={grade.id}>
              {grade.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

GradeSelector.displayName = 'GradeSelector';
