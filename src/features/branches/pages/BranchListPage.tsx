import { showToast, useAuth } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  PlusCircle,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Building2,
  Users,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { branchesApi } from '@/features/branches/api/branches'
import type { Branch } from '@/shared/types/user'
import type { PaginationMeta } from '@/shared/types/api'
import {
  BRANCH_STATUS_CONFIG,
  canCreateBranch,
  canEditBranch,
  canDeleteBranch,
  exportBranchesToCSV,
} from '../branchHelpers'
import { BranchFormModal } from '../modals/BranchFormModal'
import { DeleteBranchModal } from '../modals/DeleteBranchModal'
import './BranchManagement.css'

type SortField = 'branch_name' | 'branch_code' | 'city' | 'created_at'

const CITY_SUGGESTIONS = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia']

export const BranchListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowCreate = canCreateBranch(role)
  const allowEdit   = canEditBranch(role)
  const allowDelete = canDeleteBranch(role)

  // Data
  const queryClient = useQueryClient()

  // Filters
  const [search, setSearch]           = useState('')
  const [cityFilter, setCityFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy]           = useState<SortField>('branch_name')
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('asc')
  const [page, setPage]               = useState(1)

  // Modals
  const [showAddModal, setShowAddModal]         = useState(false)
  const [editTarget, setEditTarget]             = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget]         = useState<Branch | null>(null)

  // List query - filters/sort/page are part of the key (cached 60s)
  const listQuery = useQuery({
    queryKey: ['branches', 'list', { search: search.trim() || undefined, cityFilter, statusFilter, sortBy, sortDir, page }],
    queryFn: () =>
      branchesApi.list({
        search: search.trim() || undefined,
        city: cityFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      }),
  })

  const branches = listQuery.data?.data ?? []
  const meta = (listQuery.data?.meta as PaginationMeta | null) ?? null
  const loading = listQuery.isFetching
  const listError = listQuery.error as Error | null

  useEffect(() => {
    if (listError) showToast.error(listError.message || 'Failed to load branches.')
  }, [listError])

  /* ── Sorting ── */
  const toggleSort = (field: SortField) => {
    setPage(1)
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }
  /* ── Export ── */
  const handleExport = () => {
    if (!branches.length) {
      showToast.error('No data to export.')
      return
    }
    exportBranchesToCSV(
      branches.map((b) => ({
        branch_code: b.branch_code,
        branch_name: b.branch_name,
        city: b.city ?? '',
        address: b.address ?? '',
        phone: b.phone ?? '',
        manager: b.manager?.name ?? '',
        employees: b.total_employees ?? 0,
        status: b.status,
      })),
      'branches_export'
    )
    showToast.success('CSV exported.')
  }

  const handleSaved = (_saved: Branch) => {
    setShowAddModal(false)
    setEditTarget(null)
    // Refresh list
    queryClient.invalidateQueries({ queryKey: ['branches'] })
  }

  /* ── After Delete ── */
  const handleDeleted = (_id: number) => {
    setDeleteTarget(null)
    listQuery.refetch()
  }

  /* ── Stats ── */
  const totalActive      = branches.filter((b) => b.status === 'active').length
  const totalRenovation  = branches.filter((b) => b.status === 'under_renovation').length
  const totalEmployees   = branches.reduce((sum, b) => sum + (b.total_employees ?? 0), 0)

  /* ── Pagination ── */
  const totalPages = meta?.last_page ?? 1
  const pageRange = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    return start + i
  })

  /* ── Initials helper ── */
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="br-page">
      {/* ── Header ── */}
      <div className="br-page-header">
        <div className="br-page-header-left">
          <h1>Branch Network</h1>
          <p>
            {meta ? `${meta.total} branch${meta.total !== 1 ? 'es' : ''} in the network` : 'Loading branches…'}
          </p>
        </div>
        <div className="br-header-actions">
          <button className="br-btn br-btn-ghost" onClick={handleExport} title="Export to CSV">
            <Download size={15} />
            Export
          </button>
          <button
            className="br-btn br-btn-ghost"
            onClick={() => listQuery.refetch()}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          {allowCreate && (
            <button
              id="add-branch-btn"
              className="br-btn br-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle size={15} />
              Add Branch
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="br-stats-row">
        <div className="br-stat-card">
          <div className="br-stat-header">
            <span className="br-stat-label">Total Branches</span>
            <span className="br-stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Building2 size={17} color="var(--primary-400)" />
            </span>
          </div>
          <span className="br-stat-value">{meta?.total ?? '-'}</span>
          <span className="br-stat-sub">Across all regions</span>
        </div>
        <div className="br-stat-card">
          <div className="br-stat-header">
            <span className="br-stat-label">Active</span>
            <span className="br-stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle size={17} color="#10b981" />
            </span>
          </div>
          <span className="br-stat-value">{totalActive}</span>
          <span className="br-stat-sub">Operational branches</span>
        </div>
        <div className="br-stat-card">
          <div className="br-stat-header">
            <span className="br-stat-label">Under Renovation</span>
            <span className="br-stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Building2 size={17} color="#f59e0b" />
            </span>
          </div>
          <span className="br-stat-value">{totalRenovation}</span>
          <span className="br-stat-sub">Temporarily unavailable</span>
        </div>
        <div className="br-stat-card">
          <div className="br-stat-header">
            <span className="br-stat-label">Total Employees</span>
            <span className="br-stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Users size={17} color="#3b82f6" />
            </span>
          </div>
          <span className="br-stat-value">{totalEmployees}</span>
          <span className="br-stat-sub">Staff across branches</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="br-toolbar">
        <div className="br-search-wrap">
          <Search size={15} className="br-search-icon" />
          <input
            id="branch-search"
            type="text"
            className="br-search-input"
            placeholder="Search by name, code, or city…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          className="br-filter-select"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}
          aria-label="Filter by city"
        >
          <option value="">All Cities</option>
          {CITY_SUGGESTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="br-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="under_renovation">Under Renovation</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="br-table-wrap">
        <table className="br-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('branch_code')}>
                <span className="br-th-inner">
                  Branch Code                   {sortBy === 'branch_code' && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </span>
              </th>
              <th className="sortable" onClick={() => toggleSort('branch_name')}>
                <span className="br-th-inner">
                  Branch Name                   {sortBy === 'branch_name' && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </span>
              </th>
              <th className="sortable" onClick={() => toggleSort('city')}>
                <span className="br-th-inner">
                  City                   {sortBy === 'city' && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </span>
              </th>
              <th>Phone</th>
              <th>Manager</th>
              <th>Employees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}>
                      <div className="br-skeleton" style={{ width: j === 0 ? 80 : j === 1 ? 160 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="br-empty">
                    <div className="br-empty-icon">🏦</div>
                    <h3>No branches found</h3>
                    <p>Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              branches.map((branch) => {
                const statusCfg = BRANCH_STATUS_CONFIG[branch.status] ?? BRANCH_STATUS_CONFIG.inactive
                return (
                  <tr key={branch.id}>
                    {/* Branch Code */}
                    <td>
                      <span className="br-code">{branch.branch_code}</span>
                    </td>

                    {/* Branch Name */}
                    <td>
                      <button
                        className="br-name-link"
                        onClick={() => navigate(`/branches/${branch.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        {branch.branch_name}
                      </button>
                    </td>

                    {/* City */}
                    <td>
                      {branch.city ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} color="var(--text-muted)" />
                          {branch.city}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {branch.phone ?? '-'}
                    </td>

                    {/* Manager */}
                    <td>
                      {branch.manager ? (
                        <div className="br-manager-cell">
                          <div className="br-manager-avatar">
                            {getInitials(branch.manager.name)}
                          </div>
                          <span className="br-manager-name">{branch.manager.name}</span>
                        </div>
                      ) : (
                        <span className="br-no-manager">Unassigned</span>
                      )}
                    </td>

                    {/* Employees */}
                    <td>
                      <span className="br-employee-count">
                        <Users size={13} />
                        {branch.total_employees ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className="br-status-badge"
                        style={{
                          color: statusCfg.color,
                          background: statusCfg.bg,
                          borderColor: statusCfg.border,
                        }}
                      >
                        <span
                          className="br-status-dot"
                          style={{ background: statusCfg.color }}
                        />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="br-row-actions">
                        <button
                          className="br-btn-icon"
                          title="View Details"
                          onClick={() => navigate(`/branches/${branch.id}`)}
                        >
                          <Eye size={14} />
                        </button>
                        {allowEdit && (
                          <button
                            className="br-btn-icon"
                            title="Edit Branch"
                            onClick={() => setEditTarget(branch)}
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            className="br-btn-icon danger"
                            title="Delete Branch"
                            onClick={() => setDeleteTarget(branch)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <div className="br-pagination">
            <span>
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} branches
            </span>
            <div className="br-page-btns">
              <button
                className="br-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              {pageRange.map((p) => (
                <button
                  key={p}
                  className={`br-page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="br-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <BranchFormModal
          branch={null}
          onClose={() => setShowAddModal(false)}
          onSaved={handleSaved}
        />
      )}
      {editTarget && (
        <BranchFormModal
          branch={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteBranchModal
          branch={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
