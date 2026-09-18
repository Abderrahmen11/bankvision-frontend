import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import type { Branch } from '@/shared/types/user'

interface CustomerFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  kycFilter: string
  onKycFilterChange: (value: string) => void
  riskFilter: string
  onRiskFilterChange: (value: string) => void
  branchFilter: string
  onBranchFilterChange: (value: string) => void
  branches: Branch[]
  showBranchFilter: boolean
  onReset: () => void
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  kycFilter,
  onKycFilterChange,
  riskFilter,
  onRiskFilterChange,
  branchFilter,
  onBranchFilterChange,
  branches,
  showBranchFilter,
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    search || typeFilter || kycFilter || riskFilter || branchFilter
  )

  return (
    <div className="cm-filter-card">
      <div className="cm-filter-row">
        <div className="cm-search-wrap">
          <Search size={16} className="cm-search-icon" />
          <input
            className="cm-search-input"
            type="text"
            placeholder="Search by name, email, phone, or customer #…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Customer Type Filter */}
        <select
          className="cm-filter-select"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
        >
          <option value="">All Customer Types</option>
          <option value="regular">Standard Retail</option>
          <option value="premium">Premium Banking</option>
          <option value="business">Commercial Business</option>
        </select>

        {/* KYC Status Filter */}
        <select
          className="cm-filter-select"
          value={kycFilter}
          onChange={(e) => onKycFilterChange(e.target.value)}
        >
          <option value="">All KYC Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Review</option>
          <option value="expired">Expired</option>
        </select>

        {/* Risk Level Filter */}
        <select
          className="cm-filter-select"
          value={riskFilter}
          onChange={(e) => onRiskFilterChange(e.target.value)}
        >
          <option value="">All Risk Ratings</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>

        {/* Branch Filter (for roles with bank-wide visibility) */}
        {showBranchFilter && (
          <select
            className="cm-filter-select"
            value={branchFilter}
            onChange={(e) => onBranchFilterChange(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name} ({b.branch_code})
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="cm-btn cm-btn-ghost"
            onClick={onReset}
            title="Reset all filters"
            style={{ padding: '0.5rem 0.8rem' }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
