import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Video, X } from "lucide-react";
import { toast } from "sonner";
import { ChannelVideosList } from "./ChannelVideosList";

interface Channel {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

interface ChannelBrowserProps {
  onVideoSelect: (video: Video) => void;
}

export const ChannelBrowser = ({ onVideoSelect }: ChannelBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState("kids educational channels");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: channels, isLoading: isSearching } = useQuery({
    queryKey: ['youtube-channels', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return { channels: [] };

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/youtube-video?action=search-channels&query=${encodeURIComponent(debouncedSearchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
          },
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data;
    },
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
    }
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (selectedChannel) {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={() => setSelectedChannel(null)}
          className="mb-4"
        >
          ← Back to Channels
        </Button>
        <ChannelVideosList channel={selectedChannel} onVideoSelect={onVideoSelect} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse Educational Channels</CardTitle>
          <CardDescription>
            Discover kid-friendly educational YouTube channels or search for specific content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search for channels (e.g., 'educational kids', 'nursery rhymes')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("kids educational channels")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded animate-pulse w-24" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                </div>
                <div className="h-10 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {channels && channels.channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.channels.map((channel: Channel) => (
            <Card key={channel.channelId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img 
                  src={channel.thumbnailUrl} 
                  alt={channel.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{channel.title}</CardTitle>
                <CardDescription className="line-clamp-2">{channel.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{formatSubscriberCount(channel.subscriberCount)} subscribers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>{channel.videoCount} videos</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedChannel(channel)}
                >
                  View Videos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {channels && channels.channels.length === 0 && searchQuery && !isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          No channels found for "{searchQuery}". Try a different search term.
        </div>
      )}
    </div>
  );
};
