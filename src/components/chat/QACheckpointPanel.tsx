import { BookPageEditor } from '@/components/book/BookPageEditor';
import { PublicationStatus } from '@/types/shared/status';

interface QACheckpointPanelProps {
  showQACheckpoint: boolean;
  isBookCreated: boolean;
  createdBookId: string | null;
  currentQAPage: number;
  pageCount: number;
  displayImages: Record<number, string>;
  qaPageImages: Record<number, string>;
  qaPagePrompts: Record<number, string>;
  getCurrentPagePrompt: (pageNum: number) => string | null;
  createBookMutation: any;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageUpload: (base64: string) => void;
  onRemoveImage: (pageNumber: number) => void;
  onCreateBook: () => void;
  coverPageId?: string | null;
  bookId?: string | null;
  onCoverUpload?: (file: File) => void;
  thumbnailUrl?: string | null;
  pageTextOverlays?: Record<number, string>;
  onUpdatePageText?: (pageNumber: number, newText: string) => void;
  onToggleStatus?: () => void;
  bookStatus?: PublicationStatus;
}

export function QACheckpointPanel({
  showQACheckpoint,
  isBookCreated,
  createdBookId,
  currentQAPage,
  pageCount,
  displayImages,
  qaPageImages,
  qaPagePrompts,
  getCurrentPagePrompt,
  onClose,
  onNavigate,
  onImageUpload,
  onRemoveImage,
  coverPageId,
  bookId,
  onCoverUpload,
  thumbnailUrl,
  pageTextOverlays,
  onUpdatePageText,
  onToggleStatus,
  bookStatus = PublicationStatus.DRAFT,
}: QACheckpointPanelProps) {
  if (!showQACheckpoint) return null;

  return (
    <BookPageEditor
      currentPage={currentQAPage}
      pageCount={pageCount}
      displayImages={displayImages}
      qaPageImages={qaPageImages}
      qaPagePrompts={qaPagePrompts}
      bookId={bookId}
      createdBookId={createdBookId}
      isBookCreated={isBookCreated}
      bookStatus={bookStatus}
      coverPageId={coverPageId}
      thumbnailUrl={thumbnailUrl}
      onNavigate={onNavigate}
      onImageUpload={onImageUpload}
      onRemoveImage={onRemoveImage}
      onCoverUpload={onCoverUpload}
      onUpdatePageText={onUpdatePageText}
      onToggleStatus={onToggleStatus}
      onClose={onClose}
      getCurrentPagePrompt={getCurrentPagePrompt}
      pageTextOverlays={pageTextOverlays}
      showCloseButton={true}
    />
  );
}
