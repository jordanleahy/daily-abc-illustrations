import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { AdminOnly } from "@/components/AdminOnly";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Youtube, Users, Video, ExternalLink, Search, Check } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useYouTubeChannels,
  useAddYouTubeChannel,
  useAddResolvedYouTubeChannel,
  useBulkAddYouTubeChannels,
  useSearchYouTubeChannels,
  useDeleteYouTubeChannel,
  useToggleYouTubeChannel,
  type BulkAddResult,
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

const formatCount = (count: number | null | undefined) => {
  if (!count) return "N/A";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export default function YouTubeChannels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelInput, setChannelInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkAddResult[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: channels, isLoading } = useYouTubeChannels();
  const { data: searchResults, isFetching: isSearching, error: searchError } =
    useSearchYouTubeChannels(debouncedSearch);
  const addChannel = useAddYouTubeChannel();
  const addResolved = useAddResolvedYouTubeChannel();
  const bulkAdd = useBulkAddYouTubeChannels();
  const deleteChannel = useDeleteYouTubeChannel();
  const toggleChannel = useToggleYouTubeChannel();

  const existingIds = new Set((channels ?? []).map((c) => c.channel_id));

  const handleAddChannel = async () => {
    if (!channelInput.trim()) return;
    try {
      await addChannel.mutateAsync(channelInput.trim());
      setChannelInput("");
    } catch {
      // Error surfaced by the mutation
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) return;
    try {
      const results = await bulkAdd.mutateAsync(bulkInput);
      setBulkResults(results);
      if (results.every((r) => r.ok)) setBulkInput("");
    } catch {
      // Error surfaced by the mutation
    }
  };

  return (
    <AdminOnly>
      <PageLayout title="YouTube Channels">
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">YouTube Channels</h2>
            <p className="text-muted-foreground">
              Approved channels define exactly which videos kids can watch during screen time.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Channels</CardTitle>
              <CardDescription>
                Search by name, paste a link, or add many at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search">
                <TabsList className="mb-4">
                  <TabsTrigger value="search">Search</TabsTrigger>
                  <TabsTrigger value="link">Paste link</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk add</TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search YouTube channels by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  )}

                  {searchError && (
                    <p className="text-sm text-destructive">
                      {(searchError as Error).message}
                    </p>
                  )}

                  {!isSearching && debouncedSearch.trim().length >= 2 && searchResults?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No channels found.</p>
                  )}

                  <div className="grid gap-3">
                    {searchResults?.map((result) => {
                      const alreadyAdded = existingIds.has(result.channelId);
                      return (
                        <div
                          key={result.channelId}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          {result.thumbnailUrl ? (
                            <img
                              src={result.thumbnailUrl}
                              alt={result.title}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <Youtube className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCount(result.subscriberCount)} subscribers ·{" "}
                              {formatCount(result.videoCount)} videos
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={alreadyAdded ? "secondary" : "default"}
                            disabled={alreadyAdded || addResolved.isPending}
                            onClick={() => addResolved.mutate(result)}
                          >
                            {alreadyAdded ? (
                              <>
                                <Check className="w-4 h-4 mr-1" /> Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" /> Add
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="link" className="space-y-4">
                  <Input
                    placeholder="https://youtube.com/@channelname or UC..."
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddChannel()}
                  />
                  <Button
                    onClick={handleAddChannel}
                    disabled={addChannel.isPending || !channelInput.trim()}
                  >
                    {addChannel.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Channel
                  </Button>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                  <Textarea
                    rows={6}
                    placeholder={"One per line:\nhttps://youtube.com/@channelone\n@channeltwo\nUCxxxxxxxxxxxxxxxxxxxxxx"}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <Button
                    onClick={handleBulkAdd}
                    disabled={bulkAdd.isPending || !bulkInput.trim()}
                  >
                    {bulkAdd.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add All
                  </Button>

                  {bulkResults.length > 0 && (
                    <div className="space-y-1 text-sm">
                      {bulkResults.map((r) => (
                        <p
                          key={r.input}
                          className={r.ok ? "text-muted-foreground" : "text-destructive"}
                        >
                          {r.ok ? `✓ ${r.title}` : `✗ ${r.input} — ${r.error}`}
                        </p>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

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
                <p className="text-muted-foreground max-w-sm">
                  Add YouTube channels above so kids can watch videos during their screen time
                  rewards. Only videos from approved channels will be available.
                </p>
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
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
