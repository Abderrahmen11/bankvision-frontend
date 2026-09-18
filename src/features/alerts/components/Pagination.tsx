import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationVariant = 'numbered' | 'simple'

interface PaginationMeta {
  from: number | null
  to: number | null
  total: number
}

interface PaginationProps {
  page: number
  totalPages: number
  meta: PaginationMeta
  onPageChange: (page: number) => void
  variant: PaginationVariant
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  meta,
  onPageChange,
  variant,
}) => {
  if (variant === 'simple') {
    return (
      <div className="al-pagination">
        <span className="al-pagination-info">
          Showing page {page} of {totalPages} ({meta.total} total customers)
        </span>
        <div className="al-pagination-controls">
          <button
            className="al-page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="al-page-btn active">{page}</span>
          <button
            className="al-page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  const pages: React.ReactNode[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let currentPage = start; currentPage <= end; currentPage++) {
    pages.push(
      <button
        key={currentPage}
        className={`al-page-btn${currentPage === page ? ' active' : ''}`}
        onClick={() => onPageChange(currentPage)}
      >
        {currentPage}
      </button>
    )
  }

  return (
    <div className="al-pagination">
      <span className="al-page-info">
        Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
      </span>
      <div className="al-page-controls">
        <button
          className="al-page-btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={15} />
        </button>
        {pages}
        <button
          className="al-page-btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}