export function getBookCoverUploadInfo(bookId: string, file: File) {
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  const typeExt = file.type?.split('/')[1]?.toLowerCase();
  const ext = (typeExt || nameExt || 'png').replace('jpeg', 'jpg');
  const normalizedExt = ext === 'jpg' ? 'jpeg' : ext; // content-type prefers image/jpeg

  const contentType = file.type || `image/${normalizedExt}`;
  const fileBase = `og-${Date.now()}.${ext}`;
  const path = `${bookId}/${fileBase}`; // RLS requires first segment = book_id

  return { path, contentType };
}
