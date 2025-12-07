import { useState, useEffect, useCallback, useMemo } from 'react';

interface UsePaginationStateOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems: number;
}

interface UsePaginationStateResult {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Reusable pagination state hook
 * Handles page navigation, bounds checking, and index calculations
 */
export const usePaginationState = ({
  initialPage = 1,
  pageSize = 12,
  totalItems,
}: UsePaginationStateOptions): UsePaginationStateResult => {
  const [currentPage, setCurrentPageInternal] = useState(initialPage);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageInternal(1);
    }
  }, [currentPage, totalPages]);

  const setCurrentPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPageInternal(validPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage, setCurrentPage]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages, setCurrentPage]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
  };
};
