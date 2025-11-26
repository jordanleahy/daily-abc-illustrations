import { AuthHeader } from "@/components/layout/AuthHeader";
import { VideoGrid } from "@/components/video/VideoGrid";

export default function Videos() {
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Watch Videos</h1>
            <p className="text-muted-foreground mt-2">
              Educational videos curated for kids
            </p>
          </div>
          <VideoGrid />
        </div>
      </div>
    </div>
  );
}
