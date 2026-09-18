import React from 'react'

interface FilterBarProps {
  children: React.ReactNode
}

export const FilterBar: React.FC<FilterBarProps> = ({ children }) => (
  <div className="al-filters">{children}</div>
)