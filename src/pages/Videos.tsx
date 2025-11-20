import { useState } from "react";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YouTubeVideoPlayer } from "@/components/video/YouTubeVideoPlayer";
import { ChannelBrowser } from "@/components/video/ChannelBrowser";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

export default function Videos() {
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  const handleVideoSelect = (video: Video) => {
    setPlayingVideo(video);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {playingVideo ? (
            <Card>
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => setPlayingVideo(null)}
                  className="mb-4"
                >
                  ← Back to Browse
                </Button>
                <YouTubeVideoPlayer
                  videoId={playingVideo.videoId}
                  title={playingVideo.title}
                />
              </CardContent>
            </Card>
          ) : (
            <ChannelBrowser onVideoSelect={handleVideoSelect} />
          )}
        </div>
      </div>
    </div>
  );
}
