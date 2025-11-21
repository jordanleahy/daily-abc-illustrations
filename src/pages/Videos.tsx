import { Header } from "@/components/layout/Header";
import { ChannelBrowser } from "@/components/video/ChannelBrowser";

export default function Videos() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <ChannelBrowser />
      </div>
    </div>
  );
}
