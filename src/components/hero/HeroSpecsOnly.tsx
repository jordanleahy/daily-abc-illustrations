interface HeroSpecsOnlyProps {
  grade: string;
  subjects: string[];
  tags: string[];
}

export const HeroSpecsOnly = ({ grade, subjects, tags }: HeroSpecsOnlyProps) => {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-semibold text-muted-foreground mb-2">SPECS</h3>
        <div className="h-1 w-12 bg-emerald-500 rounded"></div>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">AGE</h4>
        <p className="text-muted-foreground">{grade}</p>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">SUBJECT</h4>
        <p className="text-muted-foreground">{subjects.join(', ')}</p>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">CHARACTERS</h4>
        <p className="text-muted-foreground">{tags.join(', ')}</p>
      </div>
    </div>
  );
};