import { showToast, useAuth } from '@/shared/hooks'
import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  Search,
  ShieldAlert,
  Eye,
  RefreshCw,
  Download,
  FileText,
  ChevronRight,
  History,
  XCircle,
} from 'lucide-react'
import { auditLogsApi } from '@/features/audit/api/auditLogs'
import { usersApi } from '@/features/users/api/users'
import type { AuditLog } from '@/features/audit/types'
import type { User } from '@/shared/types/user'
import type { UserRole } from '@/shared/types/user'
import type { PaginationMeta } from '@/shared/types/api'
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
  ROLE_OPTIONS,
  getActionMeta,
  getResourceLabel,
  changesSummary,
  formatAuditTimestamp,
  formatRelativeTime,
  exportAuditLogsToCsv,
  exportAuditLogsToExcel,
} from '../auditHelpers'
import { MobileSortSelect } from '@/shared/components/MobileSortSelect'

import './AuditLogs.css'

type SortField = 'created_at' | 'action' | 'table_name' | 'record_id' | 'ip_address'

const PAGE_SIZE = 15

/** Sort direction indicator for sortable table headers. */
const SortIcon: React.FC<{ field: SortField; active: SortField; direction: 'asc' | 'desc' }> = ({
  field,
  active,
  direction,
}) => (
  <span className={`al-sort-icon ${active === field ? 'active' : ''}`}>
    {direction === 'asc' ? '↑' : '↓'}
  </span>
)

/** Roles allowed to open the audit trail (mirrors backend route middleware). */
const ACCESS_ROLES: UserRole[] = ['admin', 'auditor', 'compliance', 'manager']

export const AuditLogListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser, hasAnyRole } = useAuth()

  const canAccess = hasAnyRole(ACCESS_ROLES)
  const role = authUser?.role ?? 'csr'

  const headerSubtitle: Record<string, string> = {
    admin: 'Full institution-wide audit trail - every privileged action, searchable and exportable.',
    auditor: 'Read-only investigation view across all bank staff activity.',
    compliance: 'Compliance-relevant activity - customer, account, transaction, loan and alert actions.',
    manager: 'Audit trail for staff assigned to your branch.',
  }

  // ── Data state ───────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([])

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const hasActiveFilters =
    Boolean(committedSearch || actionFilter || resourceFilter || userFilter || roleFilter || dateFrom || dateTo)

  // Load staff directory for the "User" filter dropdown
  useEffect(() => {
    let active = true
    usersApi
      .list({ per_page: 100, sort_by: 'name', sort_direction: 'asc' })
      .then((res) => {
        if (active) setUsers(res.data)
      })
      .catch(() => {
        /* filter dropdown is optional - page works without it */
      })
    return () => {
      active = false
    }
  }, [])

  const buildParams = useMemo(
    () => ({
      page,
      per_page: PAGE_SIZE,
      sort_by: sortBy,
      sort_direction: sortDir,
      ...(committedSearch ? { search: committedSearch } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(resourceFilter ? { table_name: resourceFilter } : {}),
      ...(userFilter ? { user_id: userFilter } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    }),
    [page, sortBy, sortDir, committedSearch, actionFilter, resourceFilter, userFilter, roleFilter, dateFrom, dateTo]
  )

  // Audit entries - fetched via React Query (params are the key)
  const logsQuery = useQuery({
    queryKey: ['audit-logs', 'list', buildParams],
    queryFn: () => auditLogsApi.list(buildParams),
  })

  const logs: AuditLog[] = logsQuery.data?.data ?? []
  const meta = (logsQuery.data?.meta ?? null) as PaginationMeta | null
  const loading = logsQuery.isFetching

  useEffect(() => {
    if (logsQuery.error) {
      showToast.error(logsQuery.error instanceof Error ? logsQuery.error.message : 'Failed to load audit logs.')
    }
  }, [logsQuery.error])

  // Debounce free-text search into the committed query
  useEffect(() => {
    const timer = setTimeout(() => {
      setCommittedSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleRefresh = () => {
    logsQuery.refetch()
  }

  const clearFilters = () => {
    setSearchInput('')
    setCommittedSearch('')
    setActionFilter('')
    setResourceFilter('')
    setUserFilter('')
    setRoleFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const updateFilter = <T extends string>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const handleExport = (format: 'csv' | 'excel') => {
    if (!logs.length) {
      showToast.info('No audit entries on this page to export.')
      return
    }
    if (format === 'csv') {
      exportAuditLogsToCsv(logs)
      showToast.success(`Exported ${logs.length} audit entries to CSV.`)
    } else {
      exportAuditLogsToExcel(logs)
      showToast.success(`Exported ${logs.length} audit entries to Excel.`)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  if (!canAccess) {
    return (
      <div className="al-page">
        <div className="al-restricted">
          <div className="al-restricted-icon">
            <ShieldAlert size={28} />
          </div>
          <h2>Access Restricted</h2>
          <p>
            Audit logs are available to administrators, internal auditors, compliance officers and branch
            managers only. Contact your system administrator if you believe this is a mistake.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="al-page al-page-audit">
      {/* ── Header ── */}
      <header className="al-header">
        <div className="al-header-left">
          <h1>
            <FileSpreadsheet size={24} color="#6366f1" />
            Audit Logs
          </h1>
          <p>{headerSubtitle[role] ?? headerSubtitle.admin}</p>
        </div>

        <div className="al-header-actions">
          <button type="button" className="al-btn al-btn-ghost" onClick={handleRefresh} disabled={loading} title="Reload audit trail">
            <RefreshCw size={15} className={loading ? 'al-spin' : ''} />
            Refresh
          </button>
          <button type="button" className="al-btn al-btn-ghost" onClick={() => handleExport('csv')}>
            <Download size={15} />
            Export CSV
          </button>
          <button type="button" className="al-btn al-btn-ghost" onClick={() => handleExport('excel')}>
            <FileText size={15} />
            Export Excel
          </button>
        </div>
      </header>

      {/* ── Scope banner ── */}
      {(role === 'manager' || role === 'compliance') && (
        <div className="al-scope-note">
          <ShieldAlert size={15} />
          {role === 'manager'
            ? 'Scoped view: only actions performed by staff assigned to your branch are shown.'
            : 'Scoped view: only compliance-relevant actions (customers, accounts, transactions, loans, alerts) are shown.'}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="al-filter-bar">
        <div className="al-search-wrap">
          <Search size={15} />
          <input
            className="al-search-input"
            placeholder="Search user, email, action, resource, or IP…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search audit logs"
          />
          {searchInput && (
            <button type="button" className="al-search-clear" onClick={() => setSearchInput('')} aria-label="Clear search">
              <XCircle size={14} />
            </button>
          )}
        </div>

        <select className="al-select" value={actionFilter} onChange={(e) => updateFilter(setActionFilter)(e.target.value)} aria-label="Filter by action">
          <option value="">All Actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {getActionMeta(a).label}
            </option>
          ))}
        </select>

        <select className="al-select" value={resourceFilter} onChange={(e) => updateFilter(setResourceFilter)(e.target.value)} aria-label="Filter by resource">
          <option value="">All Resources</option>
          {AUDIT_RESOURCES.map((r) => (
            <option key={r} value={r}>
              {getResourceLabel(r)}
            </option>
          ))}
        </select>

        <select className="al-select" value={userFilter} onChange={(e) => updateFilter(setUserFilter)(e.target.value)} aria-label="Filter by user">
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select className="al-select" value={roleFilter} onChange={(e) => updateFilter(setRoleFilter)(e.target.value)} aria-label="Filter by user role">
          <option value="">All Staff Roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <div className="al-date-group">
          <input
            type="date"
            className="al-select al-date-input"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => updateFilter(setDateFrom)(e.target.value)}
            aria-label="Date from"
          />
          <span className="al-date-sep">to</span>
          <input
            type="date"
            className="al-select al-date-input"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => updateFilter(setDateTo)(e.target.value)}
            aria-label="Date to"
          />
        </div>

        {hasActiveFilters && (
          <button type="button" className="al-btn al-btn-ghost al-clear-btn" onClick={clearFilters}>
            <XCircle size={14} />
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
            {/* Mobile sort controls (hidden on desktop) */}
      <MobileSortSelect
        value={sortBy}
        dir={sortDir}
        options={[
          { value: 'created_at', label: 'Sort by Date' },
          { value: 'action', label: 'Sort by Action' },
          { value: 'table_name', label: 'Sort by Resource' },
          { value: 'record_id', label: 'Sort by Record' },
        ]}
        onField={(v) => { handleSort(v as typeof sortBy); setPage(1) }}
        onDir={setSortDir}
      />

<div className="al-table-card">
        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th className="al-sortable" onClick={() => handleSort('created_at')}>
                  Timestamp <SortIcon field="created_at" active={sortBy} direction={sortDir} />
                </th>
                <th>User</th>
                <th className="al-sortable" onClick={() => handleSort('action')}>
                  Action <SortIcon field="action" active={sortBy} direction={sortDir} />
                </th>
                <th className="al-sortable" onClick={() => handleSort('table_name')}>
                  Resource <SortIcon field="table_name" active={sortBy} direction={sortDir} />
                </th>
                <th className="al-sortable" onClick={() => handleSort('record_id')}>
                  Record ID <SortIcon field="record_id" active={sortBy} direction={sortDir} />
                </th>
                <th className="al-sortable" onClick={() => handleSort('ip_address')}>
                  IP Address <SortIcon field="ip_address" active={sortBy} direction={sortDir} />
                </th>
                <th>Changes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="al-skeleton-row">
                      <td>
                        <div className="al-skeleton-line" style={{ width: '82%' }} />
                        <div className="al-skeleton-line al-skeleton-thin" style={{ width: '52%' }} />
                      </td>
                      <td>
                        <div className="al-user-cell">
                          <div className="al-skeleton-circle" />
                          <div>
                            <div className="al-skeleton-line" style={{ width: 90 }} />
                            <div className="al-skeleton-line al-skeleton-thin" style={{ width: 120 }} />
                          </div>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j}>
                          <div className="al-skeleton-line" style={{ width: '68%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : logs.length === 0
                  ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="al-empty">
                          <History size={40} />
                          <h3>No audit entries found</h3>
                          <p>Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : logs.map((log) => {
                      const actionMeta = getActionMeta(log.action)
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="al-ts-cell">
                              <strong>{formatRelativeTime(log.created_at)}</strong>
                              <span>{formatAuditTimestamp(log.created_at)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="al-user-cell">
                              <div className="al-avatar">
                                {(log.user?.name ?? 'S')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className="al-user-info">
                                <strong>{log.user?.name ?? 'System'}</strong>
                                <span>{log.user?.email ?? 'system@bankvision.com'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="al-action-badge" style={{ color: actionMeta.color, background: actionMeta.bg }}>
                              {actionMeta.label}
                            </span>
                          </td>
                          <td className="al-resource-cell">{getResourceLabel(log.table_name)}</td>
                          <td className="al-mono">{log.record_id ?? '-'}</td>
                          <td className="al-mono">{log.ip_address ?? '-'}</td>
                          <td>
                            <span className={`al-changes ${log.old_values || log.new_values ? '' : 'muted'}`}>
                              {changesSummary(log)}
                            </span>
                          </td>
                          <td>
                            <div className="al-row-actions">
                              <button
                                type="button"
                                className="al-action-btn"
                                title="View audit entry"
                                aria-label={`View audit entry ${log.id}`}
                                onClick={() => navigate(`/audit-logs/${log.id}`)}
                              >
                                <Eye size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <div className="al-pagination">
            <span className="al-pagination-info">
              Showing {meta.from}–{meta.to} of {meta.total} entries
            </span>
            <div className="al-pagination-controls">
              <button type="button" className="al-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.last_page - 4))
                const p = start + i
                return (
                  <button key={p} type="button" className={`al-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                className="al-page-btn"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

