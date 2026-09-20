import { showToast, useAuth } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, UserPlus, Download, RefreshCw, Eye, Pencil,
  Trash2, KeyRound, Users, ChevronUp, ChevronDown,
  ShieldAlert,
} from 'lucide-react'
import { usersApi } from '@/features/users/api/users'
import { branchesApi } from '@/features/branches/api/branches'
import type { User } from '@/shared/types/user'
import type { PaginationMeta } from '@/shared/types/api'
import {
  ROLE_LABELS, ROLE_COLORS, getAvatarColor, getInitials,
  formatDateTime, exportToCSV,
} from '../userHelpers'
import { MobileSortSelect } from '@/shared/components/MobileSortSelect'

import { AddUserModal } from '../modals/AddUserModal'
import { EditUserModal } from '../modals/EditUserModal'
import { DeleteUserModal } from '../modals/DeleteUserModal'
import { ResetPasswordModal } from '../modals/ResetPasswordModal'
import './UserManagement.css'

type SortField = 'name' | 'role' | 'created_at' | 'last_login_at'

const SortIcon: React.FC<{ field: SortField; sortBy: SortField; sortDir: 'asc' | 'desc' }> = ({
  field,
  sortBy,
  sortDir,
}) => {
  if (sortBy !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />
  return sortDir === 'asc'
    ? <ChevronUp size={12} style={{ color: 'var(--primary-400)' }} />
    : <ChevronDown size={12} style={{ color: 'var(--primary-400)' }} />
}

export const UserListPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin, isManager, isCompliance, isAnalyst, isAuditor, user: authUser } = useAuth()

  const canWrite  = isAdmin
  const canRead   = isAdmin || isManager || isCompliance || isAnalyst || isAuditor

  // State
  const queryClient = useQueryClient()
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('')
  const [statusFilter,setStatusFilter]= useState('')
  const [branchFilter,setBranchFilter]= useState('')
  const [sortBy,      setSortBy]      = useState<SortField>('created_at')
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [page,        setPage]        = useState(1)

  // Modals
  const [showAdd,         setShowAdd]         = useState(false)
  const [editTarget,      setEditTarget]      = useState<User | null>(null)
  const [deleteTarget,    setDeleteTarget]    = useState<User | null>(null)
  const [resetTarget,     setResetTarget]     = useState<User | null>(null)

  // Load branches for filter dropdown
  // Load branches
  const branchesQuery = useQuery({
    queryKey: ['branches', 'options'],
    queryFn: () => branchesApi.list({ per_page: 100 }),
  })
  const branches = branchesQuery.data?.data ?? []

  // List query - filters/sort/page are part of the key (cached 60s)
  const listQuery = useQuery({
    queryKey: ['users', 'list', { page, per_page: 15, sortBy, sortDir, search: debouncedSearch || undefined, roleFilter: roleFilter || undefined, statusFilter: statusFilter || undefined, branchFilter: branchFilter || undefined }],
    queryFn: () => {
      const params: Record<string, unknown> = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_direction: sortDir,
      }
      if (debouncedSearch) params.search       = debouncedSearch
      if (roleFilter)      params.role         = roleFilter
      if (statusFilter)    params.status       = statusFilter
      if (branchFilter)    params.branch_id    = branchFilter

      return usersApi.list(params)
    },
  })

  const users = listQuery.data?.data ?? []
  const meta = (listQuery.data?.meta as PaginationMeta | null) ?? null
  const loading = listQuery.isFetching
  const listError = listQuery.error as Error | null

  useEffect(() => {
    if (listError) showToast.error(listError.message || 'Failed to load users.')
  }, [listError])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search) }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleSort = (field: SortField) => {
    setPage(1)
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(field); setSortDir('asc') }
  }

  const handleExport = () => {
    if (!users.length) { showToast.info('No data to export.'); return }
    const rows = users.map((u) => ({
      Name:       u.name,
      Email:      u.email,
      Phone:      u.phone || '',
      Role:       u.role,
      Status:     u.status,
      Branch:     u.branch?.branch_name || '',
      'Joined':   u.created_at || '',
      'Last Login': u.last_login_at || '',
    }))
    exportToCSV(rows, `bankvision-staff-${new Date().toISOString().slice(0, 10)}`)
    showToast.success('Export started!')
  }

  if (!canRead) {
    return (
      <div className="um-page">
        <div className="um-empty">
          <ShieldAlert size={48} />
          <h3>Access Restricted</h3>
          <p>You do not have permission to view this section.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="um-page">
      {/* Header */}
      <div className="um-page-header">
        <div className="um-page-header-left">
          <h1>User Management</h1>
          <p>
            {isAdmin ? 'Full staff management - create, edit, assign roles, and more.' :
             isManager ? 'View your branch staff (read-only).' :
             'All bank staff - read-only view.'}
          </p>
        </div>
        <div className="um-header-actions">
          <button className="um-btn um-btn-ghost" onClick={() => listQuery.refetch()} title="Refresh">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="um-btn um-btn-ghost" onClick={handleExport}>
            <Download size={15} />
            Export CSV
          </button>
          {canWrite && (
            <button className="um-btn um-btn-primary" onClick={() => setShowAdd(true)}>
              <UserPlus size={16} />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="um-stats-row">
        {['active', 'suspended', 'pending'].map((s) => {
          const count = users.filter((u) => u.status === s).length
          const colors: Record<string, string> = {
            active: 'var(--emerald-500)', suspended: 'var(--rose-500)', pending: 'var(--amber-500)',
          }
          return (
            <div className="um-stat-card" key={s}>
              <div className="um-stat-label">{s.toUpperCase()} STAFF</div>
              <div className="um-stat-value" style={{ color: colors[s] }}>{count}</div>
              <div className="um-stat-sub">on this page</div>
            </div>
          )
        })}
        <div className="um-stat-card">
          <div className="um-stat-label">TOTAL (THIS PAGE)</div>
          <div className="um-stat-value">{users.length}</div>
          <div className="um-stat-sub">of {meta?.total ?? '-'} total</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="um-filter-bar">
        <div className="um-search-wrap">
          <Search size={15} />
          <input
            className="um-search-input"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="um-select"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Roles</option>
          {(['admin','manager','compliance','analyst','csr','auditor'] as const).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>

        <select
          className="um-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>

        {(isAdmin || isCompliance || isAnalyst || isAuditor) && (
          <select
            className="um-select"
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
            {/* Mobile sort controls (hidden on desktop) */}
      <MobileSortSelect
        value={sortBy}
        dir={sortDir}
        options={[
          { value: 'name', label: 'Sort by Name' },
          { value: 'role', label: 'Sort by Role' },
          { value: 'last_login_at', label: 'Sort by Last Login' },
          { value: 'created_at', label: 'Sort by Joined' },
        ]}
        onField={(v) => { handleSort(v as typeof sortBy) }}
        onDir={(dir) => { setSortDir(dir); setPage(1) }}
      />

<div className="um-table-card">
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Staff Member <SortIcon field="name" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th className="sortable" onClick={() => handleSort('role')}>
                  Role <SortIcon field="role" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th>Branch</th>
                <th>Status</th>
                <th className="sortable" onClick={() => handleSort('last_login_at')}>
                  Last Login <SortIcon field="last_login_at" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th className="sortable" onClick={() => handleSort('created_at')}>
                  Joined <SortIcon field="created_at" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="um-skeleton-row">
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div className="um-skeleton-circle" />
                          <div style={{ flex: 1 }}>
                            <div className="um-skeleton-line" style={{ width: '70%', marginBottom: '0.4rem' }} />
                            <div className="um-skeleton-line" style={{ width: '50%', height: 10 }} />
                          </div>
                        </div>
                      </td>
                      {[1,2,3,4,5,6].map((j) => (
                        <td key={j}><div className="um-skeleton-line" style={{ width: '70%' }} /></td>
                      ))}
                    </tr>
                  ))
                : users.length === 0
                ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="um-empty">
                        <Users size={40} />
                        <h3>No staff found</h3>
                        <p>Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )
                : users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="um-user-cell">
                          <div
                            className="um-avatar"
                            style={{ background: getAvatarColor(u.name) }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="um-user-info">
                            <strong>{u.name}</strong>
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`um-badge um-badge-${u.role}`}
                          style={{ color: ROLE_COLORS[u.role] }}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {u.branch?.branch_name ?? <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td>
                        <span className={`um-badge um-badge-${u.status}`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(u.last_login_at)}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(u.created_at)}
                      </td>
                      <td>
                        <div className="um-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="um-action-btn"
                            title="View details"
                            onClick={() => navigate(`/users/${u.id}`)}
                          >
                            <Eye size={15} />
                          </button>
                          {canWrite && (
                            <>
                              <button
                                className="um-action-btn"
                                title="Edit user"
                                onClick={() => setEditTarget(u)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="um-action-btn warning"
                                title="Reset password"
                                onClick={() => setResetTarget(u)}
                              >
                                <KeyRound size={15} />
                              </button>
                              {u.id !== authUser?.id && (
                                <button
                                  className="um-action-btn danger"
                                  title="Delete user"
                                  onClick={() => setDeleteTarget(u)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="um-pagination">
            <span className="um-pagination-info">
              Showing {meta.from}–{meta.to} of {meta.total} staff
            </span>
            <div className="um-pagination-controls">
              <button
                className="um-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.last_page - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    className={`um-page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                className="um-page-btn"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddUserModal
          branches={branches}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); queryClient.invalidateQueries({ queryKey: ['users'] }) }}
        />
      )}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          branches={branches}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); queryClient.invalidateQueries({ queryKey: ['users'] }) }}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ['users'] }) }}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  )
}
