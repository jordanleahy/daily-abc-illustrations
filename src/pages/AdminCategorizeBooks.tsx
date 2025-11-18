import { useState } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCategorizeBooks, useCategorizationLogs, CategorizationPreview } from '@/hooks/useCategorizeBooks';
import { Loader2, CheckCircle, AlertCircle, Undo } from 'lucide-react';
import { toast } from 'sonner';
import { BOOK_TYPES } from '@/config/bookTypes';

export default function AdminCategorizeBooks() {
  const { preview, applyChanges, rollback } = useCategorizeBooks();
  const { data: logs } = useCategorizationLogs();
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState(false);

  const handleSelectChange = (bookId: string, checked: boolean) => {
    const newSelected = new Set(selectedChanges);
    if (checked) {
      newSelected.add(bookId);
    } else {
      newSelected.delete(bookId);
    }
    setSelectedChanges(newSelected);
  };

  const handleSelectAllHighConfidence = () => {
    if (!preview.data?.previews) return;
    const highConfidence = preview.data.previews
      .filter(p => p.confidence_score >= 0.9)
      .map(p => p.book_id);
    setSelectedChanges(new Set(highConfidence));
  };

  const handleApplySelected = async () => {
    if (!preview.data?.previews || selectedChanges.size === 0) return;

    const changes = preview.data.previews
      .filter(p => selectedChanges.has(p.book_id))
      .map(p => ({
        book_id: p.book_id,
        new_book_type: p.proposed_book_type,
        confidence_score: p.confidence_score,
        notes: p.reasoning,
      }));

    try {
      await applyChanges.mutateAsync(changes);
      toast.success(`Applied ${changes.length} categorization changes`);
      setSelectedChanges(new Set());
    } catch (error) {
      toast.error('Failed to apply changes: ' + error.message);
    }
  };

  const handleRollbackAll = async () => {
    if (!logs || logs.length === 0) return;

    try {
      const recentLogIds = logs
        .filter(log => log.can_rollback && !log.rollback_at)
        .map(log => log.id);

      await rollback.mutateAsync({ log_ids: recentLogIds });
      toast.success('Rolled back all recent changes');
    } catch (error) {
      toast.error('Failed to rollback: ' + error.message);
    }
  };

  const getBookTypeLabel = (typeId: string) => {
    const bookType = BOOK_TYPES.find(t => t.id === typeId);
    return bookType?.label || typeId;
  };

  return (
    <AdminOnly>
      <StandardPageLayout>
        <div className="container max-w-7xl mx-auto py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Book Categorization Migration</h1>
            <p className="text-muted-foreground">
              Review and apply AI-suggested categorizations for existing books
            </p>
          </div>

          {preview.isLoading && (
            <Card>
              <CardContent className="pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Analyzing books...</span>
              </CardContent>
            </Card>
          )}

          {preview.data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{preview.data.total_books}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Need Categorization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {preview.data.books_needing_categorization}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {preview.data.high_confidence_count}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {preview.data.needs_review_count}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    {selectedChanges.size} books selected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleSelectAllHighConfidence}
                      variant="outline"
                      size="sm"
                    >
                      Select All High Confidence (≥90%)
                    </Button>
                    <Button
                      onClick={() => setSelectedChanges(new Set())}
                      variant="outline"
                      size="sm"
                      disabled={selectedChanges.size === 0}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={() => setShowLogs(!showLogs)}
                      variant="outline"
                      size="sm"
                    >
                      {showLogs ? 'Hide' : 'Show'} Change Logs
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApplySelected}
                      disabled={selectedChanges.size === 0 || applyChanges.isPending}
                      className="flex-1"
                    >
                      {applyChanges.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Apply Selected Changes ({selectedChanges.size})
                    </Button>
                    {logs && logs.length > 0 && (
                      <Button
                        onClick={handleRollbackAll}
                        variant="destructive"
                        disabled={rollback.isPending}
                      >
                        {rollback.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Undo className="mr-2 h-4 w-4" />
                        Rollback All
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {showLogs && logs && logs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Changes Log</CardTitle>
                    <CardDescription>Last {logs.length} categorization changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div key={log.id} className="text-sm p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.book_id.slice(0, 8)}...</span>
                              <Badge variant={log.can_rollback ? 'default' : 'secondary'}>
                                {log.rollback_at ? 'Rolled Back' : 'Active'}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground mt-1">
                              {log.old_book_type || 'null'} → {log.new_book_type}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(log.applied_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Proposed Categorizations</CardTitle>
                  <CardDescription>
                    Review and select changes to apply
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {preview.data.previews.map((item: CategorizationPreview) => (
                        <div key={item.book_id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Checkbox
                                checked={selectedChanges.has(item.book_id)}
                                onCheckedChange={(checked) => 
                                  handleSelectChange(item.book_id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.book_name}</h4>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <Badge variant="outline">
                                    Current: {item.current_book_type || 'none'}
                                  </Badge>
                                  <span>→</span>
                                  <Badge>
                                    Proposed: {getBookTypeLabel(item.proposed_book_type)}
                                  </Badge>
                                </div>
                                {item.current_category && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Old Category: {item.current_category}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.confidence_score >= 0.9 ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              )}
                              <Badge variant={item.needs_review ? 'destructive' : 'default'}>
                                {Math.round(item.confidence_score * 100)}%
                              </Badge>
                            </div>
                          </div>
                          <Separator />
                          <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </StandardPageLayout>
    </AdminOnly>
  );
}
