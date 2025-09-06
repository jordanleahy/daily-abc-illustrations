interface HeroSpecsProps {
  title: string;
  price: string;
  grade: string;
  subjects: string[];
  tags: string[];
}

export const HeroSpecs = ({ title, price, grade, subjects, tags }: HeroSpecsProps) => {
  return (
    <div className="space-y-4 text-sm">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-2xl font-bold text-foreground">{price}</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-muted-foreground mb-2">SPECS</h3>
        <div className="h-1 w-12 bg-emerald-500 rounded"></div>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">GRADE</h4>
        <p className="text-muted-foreground">{grade}</p>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">SUBJECT</h4>
        <p className="text-muted-foreground">{subjects.join(', ')}</p>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">TAGS</h4>
        <p className="text-muted-foreground">{tags.join(', ')}</p>
      </div>
    </div>
  );
};