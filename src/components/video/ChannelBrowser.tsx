import { ChannelVideosList } from "./ChannelVideosList";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

interface ChannelBrowserProps {
  onVideoSelect?: (video: Video) => void;
}

// Locked to Google's official YouTube channel
const LOCKED_CHANNEL = {
  channelId: "UCVHFbqXqoYvEWM1Ddxl0QKg",
  title: "Google",
  description: "Experience the world of Google on our official YouTube channel.",
  thumbnailUrl: "https://yt3.googleusercontent.com/veryofnope/AAAAAAAAAAI/AAAAAAAAAAA/default.jpg",
  subscriberCount: 14000000,
  videoCount: 2500,
};

export const ChannelBrowser = ({ onVideoSelect }: ChannelBrowserProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <img 
          src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
          alt="Google"
          className="h-8 object-contain"
        />
        <div>
          <h2 className="font-semibold">Google Official Channel</h2>
          <p className="text-sm text-muted-foreground">
            Watch educational videos from Google
          </p>
        </div>
      </div>
      <ChannelVideosList channel={LOCKED_CHANNEL} onVideoSelect={onVideoSelect} />
    </div>
  );
};
