import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Video } from "lucide-react";
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

export const ChannelBrowser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const queryClient = useQueryClient();

  const { data: channels, isLoading: isSearching } = useQuery({
    queryKey: ['youtube-channels', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { channels: [] };

      const { data, error } = await supabase.functions.invoke('youtube-video', {
        body: {},
        method: 'GET',
      });

      if (error) throw error;
      
      const url = new URL(data.url || window.location.href);
      url.searchParams.set('action', 'search-channels');
      url.searchParams.set('query', searchQuery);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data;
    },
    enabled: searchQuery.trim().length > 0,
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
        <ChannelVideosList channel={selectedChannel} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse YouTube Channels</CardTitle>
          <CardDescription>
            Search for kid-friendly YouTube channels and add their videos to your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search for channels (e.g., 'educational kids', 'nursery rhymes')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          Searching channels...
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
