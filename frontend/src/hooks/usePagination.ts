import { useState, useMemo } from 'react'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface PaginationControls {
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setPageSize: (pageSize: number) => void
}

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  total = 0,
}: UsePaginationOptions = {}): PaginationControls {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  const hasNextPage = useMemo(() => {
    return page < totalPages
  }, [page, totalPages])

  const hasPreviousPage = useMemo(() => {
    return page > 1
  }, [page])

  const goToPage = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages))
    setPage(clampedPage)
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1)
    }
  }

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setPage(page - 1)
    }
  }

  const goToFirstPage = () => {
    setPage(1)
  }

  const goToLastPage = () => {
    setPage(totalPages)
  }

  const handleSetPageSize = (newPageSize: number) => {
    setPageSize(newPageSize)
    // Reset to page 1 when changing page size
    setPage(1)
  }

  return {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize: handleSetPageSize,
  }
}

export function getPaginationRange(currentPage: number, totalPages: number, delta: number = 2) {
  const range: (number | string)[] = []
  const rangeWithDots: (number | string)[] = []

  // Calculate range around current page
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)

  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  // Add first page and dots if necessary
  if (start > 2) {
    rangeWithDots.push(1, '...')
  } else if (start === 2) {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  // Add last page and dots if necessary
  if (end < totalPages - 1) {
    rangeWithDots.push('...', totalPages)
  } else if (end === totalPages - 1) {
    rangeWithDots.push(totalPages)
  }

  return rangeWithDots
}
