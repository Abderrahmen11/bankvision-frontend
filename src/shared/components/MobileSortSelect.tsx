import React from 'react'

interface SortOption {
  value: string
  label: string
}

interface MobileSortSelectProps {
  value: string
  dir: 'asc' | 'desc'
  options: SortOption[]
  onField: (value: string) => void
  onDir: (dir: 'asc' | 'desc') => void
  label?: string
}

/**
 * Mobile-only sort controls shown above list tables (tables hide their
 * sortable headers below 768px). Hidden on desktop - no behavior change.
 */
export const MobileSortSelect: React.FC<MobileSortSelectProps> = ({
  value,
  dir,
  options,
  onField,
  onDir,
  label = 'Sort by',
}) => {
  return (
    <div className="mobile-sort">
      <select
        className="mobile-sort-field"
        value={value}
        onChange={(e) => onField(e.target.value)}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="mobile-sort-dir"
        onClick={() => onDir(dir === 'asc' ? 'desc' : 'asc')}
        aria-label={dir === 'asc' ? 'Ascending - tap for descending' : 'Descending - tap for ascending'}
        title={dir === 'asc' ? 'Ascending' : 'Descending'}
      >
        {dir === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>
    </div>
  )
}
