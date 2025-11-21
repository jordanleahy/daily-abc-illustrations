import { AuthHeader } from "@/components/layout/AuthHeader";
import { ChannelBrowser } from "@/components/video/ChannelBrowser";

export default function Videos() {
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <div className="container mx-auto px-4 py-8">
        <ChannelBrowser />
      </div>
    </div>
  );
}
