import { useEffect } from "react";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { VideoGrid } from "@/components/video/VideoGrid";

export default function Videos() {
  // Enforce dark mode on this route
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <StandardPageLayout>
      <div className="py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Watch Videos</h1>
          <p className="text-muted-foreground mt-2">
            Educational videos curated for kids
          </p>
        </div>
        <VideoGrid />
      </div>
    </StandardPageLayout>
  );
}
