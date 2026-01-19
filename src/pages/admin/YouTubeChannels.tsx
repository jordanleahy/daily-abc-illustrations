import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { AdminOnly } from "@/components/AdminOnly";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Youtube, Users, Video, ExternalLink } from "lucide-react";
import { 
  useYouTubeChannels, 
  useAddYouTubeChannel, 
  useDeleteYouTubeChannel,
  useToggleYouTubeChannel 
} from "@/hooks/useYouTubeChannels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function YouTubeChannels() {
  const [channelInput, setChannelInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: channels, isLoading } = useYouTubeChannels();
  const addChannel = useAddYouTubeChannel();
  const deleteChannel = useDeleteYouTubeChannel();
  const toggleChannel = useToggleYouTubeChannel();

  const handleAddChannel = async () => {
    if (!channelInput.trim()) return;
    
    try {
      await addChannel.mutateAsync(channelInput.trim());
      setChannelInput("");
      setIsAdding(false);
    } catch {
      // Error handled by mutation
    }
  };

  const formatCount = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <AdminOnly>
      <PageLayout title="YouTube Channels">
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">YouTube Channels</h2>
              <p className="text-muted-foreground">
                Manage approved YouTube channels for kids' screen time rewards
              </p>
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
            )}
          </div>

          {isAdding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add YouTube Channel</CardTitle>
                <CardDescription>
                  Paste a YouTube channel URL, handle (@channelname), or channel ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="https://youtube.com/@channelname or UC..."
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddChannel} 
                    disabled={addChannel.isPending || !channelInput.trim()}
                  >
                    {addChannel.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Channel
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setChannelInput(""); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !channels || channels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Youtube className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Channels Added</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  Add YouTube channels to allow kids to watch videos during their screen time rewards. 
                  Only videos from approved channels will be available.
                </p>
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Channel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {channels.map((channel) => (
                <Card key={channel.id} className={!channel.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {channel.channel_thumbnail_url ? (
                      <img 
                        src={channel.channel_thumbnail_url} 
                        alt={channel.channel_title}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Youtube className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{channel.channel_title}</h3>
                        {!channel.is_active && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatCount(channel.subscriber_count)} subscribers
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {formatCount(channel.video_count)} videos
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {channel.channel_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <a 
                        href={`https://youtube.com/channel/${channel.channel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch
                          checked={channel.is_active}
                          onCheckedChange={(checked) => 
                            toggleChannel.mutate({ id: channel.id, is_active: checked })
                          }
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Channel</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{channel.channel_title}"? 
                              Kids will no longer be able to watch videos from this channel.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteChannel.mutate(channel.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {channels && channels.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Only videos from active channels above will be available 
                  during kids' screen time. Disable a channel to temporarily hide its videos, 
                  or remove it completely.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
