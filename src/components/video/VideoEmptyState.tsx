import { Youtube } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function VideoEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Youtube className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Videos Available</h3>
        <p className="text-muted-foreground max-w-md">
          There are no approved YouTube channels configured yet. 
          Ask a parent to add some channels so you can watch videos!
        </p>
      </CardContent>
    </Card>
  );
}
