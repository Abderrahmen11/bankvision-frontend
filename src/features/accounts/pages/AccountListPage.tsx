import { showToast, useAuth } from '@/shared/hooks'
import { toAmountNumber } from '@/shared/utils'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, PlusCircle, Download, RefreshCw, Eye, Pencil,
  Trash2, CreditCard, TrendingUp, ShieldAlert, BarChart3,
  ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react'
import { accountsApi } from '@/features/accounts/api/accounts'
import { branchesApi } from '@/features/branches/api/branches'
import type { BankAccount } from '@/features/accounts/types'
import type { PaginationMeta } from '@/shared/types/api'
import {
  ACCOUNT_TYPE_CONFIG,
  ACCOUNT_STATUS_CONFIG,
  formatCurrency,
  formatDate,
  getAvatarColor,
  exportToCSV,
  canOpenAccount,
  canEditAccount,
  canCloseAccount,
  canViewAllBranches,
} from '../accountHelpers'
import { MobileSortSelect } from '@/shared/components/MobileSortSelect'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { OpenAccountModal } from '../modals/OpenAccountModal'
import { EditAccountModal } from '../modals/EditAccountModal'
import { CloseAccountModal } from '../modals/CloseAccountModal'
import './AccountManagement.css'

type SortField = 'account_number' | 'balance' | 'opened_date'

export const AccountListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  // Permissions
  const allowOpen  = canOpenAccount(role)
  const allowEdit  = canEditAccount(role)
  const allowClose = canCloseAccount(role)
  const canSeeAllBranches = canViewAllBranches(role)

  // Data
  const queryClient = useQueryClient()

  // Filters
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [branchFilter, setBranchFilter]   = useState('')
  const [sortBy, setSortBy]               = useState<SortField>('opened_date')
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc')
  const [page, setPage]                   = useState(1)

  // List query - filters/sort/page are part of the key (cached 60s)
  const listQuery = useQuery({
    queryKey: ['accounts', 'list', { search: search.trim() || undefined, typeFilter, statusFilter, branchFilter, sortBy, sortDir, page }],
    queryFn: () =>
      accountsApi.list({
        search: search.trim() || undefined,
        account_type: typeFilter || undefined,
        status: statusFilter || undefined,
        branch_id: branchFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      }),
  })

  const accounts = listQuery.data?.data ?? []
  const meta = (listQuery.data?.meta as PaginationMeta | null) ?? null
  const loading = listQuery.isFetching
  const listError = listQuery.error as Error | null

  // Server-side KPI facet counts (same filters minus status; per_page 1,
  // only meta.total is read). Balance totals have no server aggregate, so
  // they stay page-scoped and are labeled accordingly.
  const kpiBaseParams = {
    search: search.trim() || undefined,
    account_type: typeFilter || undefined,
    branch_id: branchFilter || undefined,
  }
  const activeTotalQuery = useQuery({
    queryKey: ['accounts', 'kpi-active', kpiBaseParams],
    queryFn: () => accountsApi.list({ ...kpiBaseParams, status: 'active', per_page: 1 }),
  })
  const frozenTotalQuery = useQuery({
    queryKey: ['accounts', 'kpi-frozen', kpiBaseParams],
    queryFn: () => accountsApi.list({ ...kpiBaseParams, status: 'frozen', per_page: 1 }),
  })

  // Modals
  const [showOpenModal, setShowOpenModal]   = useState(false)
  const [editTarget, setEditTarget]         = useState<BankAccount | null>(null)
  const [closeTarget, setCloseTarget]       = useState<BankAccount | null>(null)

  // Load branches
  const branchesQuery = useQuery({
    queryKey: ['branches', 'options'],
    queryFn: () => branchesApi.list({ per_page: 100 }),
  })
  const branches = branchesQuery.data?.data ?? []


  // Surface fetch errors the same way the old catch block did
  useEffect(() => {
    if (listError) showToast.error(listError.message || 'Failed to fetch accounts.')
  }, [listError])

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    
    setBranchFilter('')
    setPage(1)
  }

  const handleExportCSV = () => {
    if (!accounts.length) {
      showToast.error('No account records to export.')
      return
    }
    const exportData = accounts.map((a) => ({
      'Account Number': a.account_number,
      'Customer': a.customer?.full_name || `ID:${a.customer_id}`,
      'Type': a.account_type,
      'Currency': a.currency,
      'Balance': a.balance,
      'Status': a.status,
      'Opened Date': a.opened_date || '',
      'Interest Rate': a.interest_rate,
    }))
    exportToCSV(exportData, `bankvision_accounts_${new Date().toISOString().split('T')[0]}`)
    showToast.success('Export downloaded successfully!')
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  // KPI — active/frozen from server totals; balance is a page sum (no API aggregate)
  const totalActive =
    (activeTotalQuery.data?.meta as PaginationMeta | null)?.total ??
    accounts.filter((a) => a.status === 'active').length
  const totalFrozen =
    (frozenTotalQuery.data?.meta as PaginationMeta | null)?.total ??
    accounts.filter((a) => a.status === 'frozen').length
  const totalBalance  = accounts.reduce((sum, a) => sum + toAmountNumber(a.balance), 0)

  return (
    <div className="am-page">
      {/* Header */}
      <div className="am-page-header">
        <div className="am-page-header-left">
          <h1>Account Management</h1>
          <p>Manage bank accounts, view balances, and track account activity across all branches.</p>
        </div>
        <div className="am-header-actions">
          <button className="am-btn am-btn-ghost" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="am-btn am-btn-ghost"
            onClick={() => listQuery.refetch()}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'am-spin' : ''} />
          </button>
          {allowOpen && (
            <button
              className="am-btn am-btn-primary"
              onClick={() => setShowOpenModal(true)}
            >
              <PlusCircle size={16} /> Open Account
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="am-stats-row">
        <div className="am-stat-card">
          <div className="am-stat-header">
            <span className="am-stat-label">Total Accounts</span>
            <div className="am-stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-400)' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <span className="am-stat-value">{meta?.total ?? accounts.length}</span>
          <span className="am-stat-sub">Loaded in current view</span>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-header">
            <span className="am-stat-label">Active Accounts</span>
            <div className="am-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald-500)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="am-stat-value">{totalActive}</span>
          <span className="am-stat-sub">Operational accounts</span>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-header">
            <span className="am-stat-label">Frozen Accounts</span>
            <div className="am-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber-500)' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <span className="am-stat-value" style={{ color: totalFrozen > 0 ? 'var(--amber-500)' : 'inherit' }}>
            {totalFrozen}
          </span>
          <span className="am-stat-sub">Requires attention</span>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-header">
            <span className="am-stat-label">Total Holdings (Page)</span>
            <div className="am-stat-icon" style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--cyan-500)' }}>
              <BarChart3 size={16} />
            </div>
          </div>
          <span className="am-stat-value" style={{ fontSize: '1.35rem' }}>
            {formatCurrency(totalBalance)}
          </span>
          <span className="am-stat-sub">Sum of listed page — no server aggregate</span>
        </div>
      </div>

      {/* Filters */}
      <div className="am-filter-card">
        <div className="am-filter-row">
          <div className="am-search-wrap">
            <Search size={16} className="am-search-icon" />
            <input
              className="am-search-input"
              type="text"
              placeholder="Search by account number or customer name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <select
            className="am-filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Account Types</option>
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
            <option value="business">Business</option>
          </select>

          <select
            className="am-filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="closed">Closed</option>
          </select>

          {canSeeAllBranches && (
            <select
              className="am-filter-select"
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name} ({b.branch_code})
                </option>
              ))}
            </select>
          )}

          {(search || typeFilter || statusFilter || branchFilter) && (
            <button
              className="am-btn am-btn-ghost"
              onClick={handleResetFilters}
              style={{ padding: '0.5rem 0.8rem' }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
            {/* Mobile sort controls (hidden on desktop) */}
      <MobileSortSelect
        value={sortBy}
        dir={sortDir}
        options={[
          { value: 'opened_date', label: 'Sort by Opened Date' },
          { value: 'balance', label: 'Sort by Balance' },
          { value: 'account_number', label: 'Sort by Number' },
        ]}
        onField={(v) => { setSortBy(v as typeof sortBy); setPage(1) }}
        onDir={setSortDir}
      />

<div className="am-table-card">
        <div className="am-table-wrapper">
          <table className="am-table">
            <thead>
              <tr>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('account_number')}
                >
                  Account Number
                  {sortBy === 'account_number' && (
                    sortDir === 'asc'
                      ? <ChevronUp size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      : <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                  )}
                </th>
                <th>Customer</th>
                <th>Type</th>
                <th>Currency</th>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('balance')}
                >
                  Balance
                  {sortBy === 'balance' && (
                    sortDir === 'asc'
                      ? <ChevronUp size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      : <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                  )}
                </th>
                <th>Status</th>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('opened_date')}
                >
                  Opened
                  {sortBy === 'opened_date' && (
                    sortDir === 'asc'
                      ? <ChevronUp size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                      : <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                  )}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="am-loading">
                      <div className="am-spinner" />
                      <span>Loading accounts…</span>
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="am-empty">
                      <CreditCard size={36} color="var(--text-muted)" />
                      <p>No accounts found matching the current criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const typeCfg   = ACCOUNT_TYPE_CONFIG[account.account_type] || ACCOUNT_TYPE_CONFIG.savings
                  const statusCfg = ACCOUNT_STATUS_CONFIG[account.status] || ACCOUNT_STATUS_CONFIG.active
                  const customerName = account.customer?.full_name || `Customer #${account.customer_id}`

                  return (
                    <tr key={account.id}>
                      {/* Account Number */}
                      <td>
                        <div className="am-account-cell">
                          <div
                            className="am-account-avatar"
                            style={{ background: getAvatarColor(account.account_number) }}
                          >
                            {account.account_type.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="am-account-meta">
                            <span
                              className="am-account-number"
                              onClick={() => navigate(`/accounts/${account.id}`)}
                            >
                              {account.account_number}
                            </span>
                            <span className="am-account-sub">
                              Rate: {account.interest_rate}%
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <span
                          style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, cursor: account.customer ? 'pointer' : 'default' }}
                          onClick={() => account.customer && navigate(`/customers/${account.customer_id}`)}
                        >
                          {customerName}
                        </span>
                      </td>

                      {/* Account Type */}
                      <td>
                        <span
                          className="am-badge"
                          style={{ color: typeCfg.color, background: typeCfg.bg, border: `1px solid ${typeCfg.border}` }}
                        >
                          {typeCfg.label}
                        </span>
                      </td>

                      {/* Currency */}
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {account.currency}
                        </span>
                      </td>

                      {/* Balance */}
                      <td>
                        <span style={{ fontWeight: 700, color: toAmountNumber(account.balance) > 0 ? 'var(--emerald-500)' : 'var(--text-primary)' }}>
                          {formatCurrency(account.balance, account.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="am-badge"
                          style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                        >
                          <span className="am-badge-dot" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Opened Date */}
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {formatDate(account.opened_date)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="am-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="am-icon-btn"
                            title="View Account"
                            onClick={() => navigate(`/accounts/${account.id}`)}
                          >
                            <Eye size={15} />
                          </button>
                          {allowEdit && account.status !== 'closed' && (
                            <button
                              className="am-icon-btn"
                              title="Edit Account"
                              onClick={() => setEditTarget(account)}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {allowClose && account.status !== 'closed' && (
                            <button
                              className="am-icon-btn danger"
                              title="Close Account"
                              onClick={() => setCloseTarget(account)}
                            >
                              <Trash2 size={15} />
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
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="am-pagination">
            <span>
              Showing {((page - 1) * meta.per_page) + 1} to{' '}
              {Math.min(page * meta.per_page, meta.total)} of {meta.total} accounts
            </span>
            <div className="am-page-controls">
              <button className="am-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.last_page - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    className={`am-page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              })}
              <button className="am-page-btn" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showOpenModal && (
        <OpenAccountModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => { setShowOpenModal(false); queryClient.invalidateQueries({ queryKey: ['accounts'] }) }}
        />
      )}
      {editTarget && (
        <EditAccountModal
          account={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); queryClient.invalidateQueries({ queryKey: ['accounts'] }) }}
        />
      )}
      {closeTarget && (
        <CloseAccountModal
          account={closeTarget}
          onClose={() => setCloseTarget(null)}
          onSuccess={() => { setCloseTarget(null); queryClient.invalidateQueries({ queryKey: ['accounts'] }) }}
        />
      )}
    </div>
  )
}
