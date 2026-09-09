import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  PlusCircle,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'
import { transactionsApi } from '@/api/transactions'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Transaction } from '@/types/transaction'
import type { PaginationMeta } from '@/types/api'
import {
  TX_TYPE_CONFIG,
  TX_STATUS_CONFIG,
  formatCurrency,
  formatDate,
  formatAmountCompact,
  isCredit,
  isHighValue,
  canApproveTransaction,
  canFlagTransaction,
  canRecordTransaction,
  getChannelLabel,
  exportToCSV,
} from './transactionHelpers'
import { RecordTransactionModal } from './modals/RecordTransactionModal'
import './TransactionManagement.css'

export const TransactionListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  // Permissions
  const allowApprove = canApproveTransaction(role)
  const allowFlag = canFlagTransaction(role)
  const allowRecord = canRecordTransaction(role)
  const isCompliance = role === 'compliance'

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'transaction_date' | 'amount'>('transaction_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false)

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionsApi.list({
        search: search.trim() || undefined,
        transaction_type: typeFilter || undefined,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      })
      setTransactions(res.data || [])
      setMeta(res.meta as PaginationMeta)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transactions.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, channelFilter, dateFrom, dateTo, sortBy, sortDir, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setChannelFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  // Quick Actions: Approve
  const handleApprove = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to approve transaction ${tx.transaction_number}?`)) {
      return
    }
    setActionLoadingId(tx.id)
    try {
      await transactionsApi.approve(tx.id)
      showToast.success(`Transaction ${tx.transaction_number} approved!`)
      fetchTransactions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve transaction.'
      showToast.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Quick Actions: Flag
  const handleFlag = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Flag transaction ${tx.transaction_number} as suspicious for compliance review?`)) {
      return
    }
    setActionLoadingId(tx.id)
    try {
      await transactionsApi.flag(tx.id)
      showToast.success(`Transaction ${tx.transaction_number} flagged for review.`)
      fetchTransactions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to flag transaction.'
      showToast.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!transactions.length) {
      showToast.error('No transaction records to export.')
      return
    }
    const exportData = transactions.map((t) => ({
      'Transaction ID': t.transaction_number,
      'Date': t.transaction_date,
      'Account': t.account?.account_number || t.account_id || '',
      'Customer': t.account?.customer?.full_name || '',
      'Type': t.transaction_type,
      'Amount': t.amount,
      'Currency': t.currency,
      'Channel': t.channel || '',
      'Status': t.status,
      'Counterparty': t.counterparty || '',
      'Approved By': t.approver?.name || '',
      'Approved At': t.approved_at || '',
    }))
    exportToCSV(exportData, `bankvision_transactions_${new Date().toISOString().split('T')[0]}`)
    showToast.success('Export downloaded successfully!')
  }

  const toggleSort = (field: 'transaction_date' | 'amount') => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  // KPI Calculations
  const totalCompleted = transactions.filter((t) => t.status === 'completed').length
  const totalFlagged = transactions.filter((t) => t.status === 'flagged').length
  const highValueCount = transactions.filter((t) => isHighValue(t.amount)).length
  const totalVolume = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  return (
    <div className="tx-page">
      {/* Header */}
      <div className="tx-page-header">
        <div className="tx-page-header-left">
          <h1>Transaction Management</h1>
          <p>
            Audit, track, and monitor real-time banking transactions, wire transfers, and compliance alerts.
          </p>
        </div>
        <div className="tx-header-actions">
          <button className="tx-btn tx-btn-ghost" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="tx-btn tx-btn-ghost"
            onClick={fetchTransactions}
            title="Refresh transactions"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'tx-spin' : ''} /> Refresh
          </button>
          {allowRecord && (
            <button className="tx-btn tx-btn-primary" onClick={() => setShowRecordModal(true)}>
              <PlusCircle size={15} /> Record Transaction
            </button>
          )}
        </div>
      </div>

      {/* Compliance Scoped Notice Banner */}
      {isCompliance && (
        <div className="tx-compliance-banner">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Compliance Scoped View:</strong> In accordance with financial security policy, your view is
            automatically filtered to flagged transactions, high-value transfers (≥ $10,000), and wire activity.
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="tx-stats-row">
        <div className="tx-stat-card">
          <div className="tx-stat-header">
            <span className="tx-stat-label">Total Transactions</span>
            <div className="tx-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="tx-stat-value">{meta?.total ?? transactions.length}</div>
          <div className="tx-stat-sub">Across accessible accounts</div>
        </div>

        <div className="tx-stat-card">
          <div className="tx-stat-header">
            <span className="tx-stat-label">Completed Volume</span>
            <div className="tx-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="tx-stat-value">{formatAmountCompact(totalVolume)}</div>
          <div className="tx-stat-sub">{totalCompleted} successful transactions</div>
        </div>

        <div className="tx-stat-card">
          <div className="tx-stat-header">
            <span className="tx-stat-label">Flagged for Review</span>
            <div className="tx-stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="tx-stat-value" style={{ color: totalFlagged > 0 ? '#f43f5e' : undefined }}>
            {totalFlagged}
          </div>
          <div className="tx-stat-sub">Suspicious activity alerts</div>
        </div>

        <div className="tx-stat-card">
          <div className="tx-stat-header">
            <span className="tx-stat-label">High-Value (≥ $10K)</span>
            <div className="tx-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="tx-stat-value" style={{ color: highValueCount > 0 ? '#f59e0b' : undefined }}>
            {highValueCount}
          </div>
          <div className="tx-stat-sub">Requires compliance tracking</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="tx-filter-card">
        <div className="tx-filter-row">
          {/* Search */}
          <div className="tx-search-wrap">
            <Search size={15} className="tx-search-icon" />
            <input
              type="text"
              className="tx-search-input"
              placeholder="Search by transaction # or account #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Type Filter */}
          <select
            className="tx-filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="wire">Wire Transfer</option>
          </select>

          {/* Status Filter */}
          <select
            className="tx-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
            <option value="failed">Failed</option>
          </select>

          {/* Channel Filter */}
          <select
            className="tx-filter-select"
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Channels</option>
            <option value="branch">Branch</option>
            <option value="atm">ATM</option>
            <option value="online">Online Banking</option>
            <option value="mobile">Mobile App</option>
          </select>

          {/* Date Range */}
          <div className="tx-date-wrap">
            <input
              type="date"
              className="tx-filter-input"
              title="From date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
            <span>to</span>
            <input
              type="date"
              className="tx-filter-input"
              title="To date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Reset button */}
          <button className="tx-btn tx-btn-ghost" onClick={handleResetFilters} title="Reset all filters">
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="tx-table-card">
        <div className="tx-table-wrapper">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('transaction_date')}>
                  Date {sortBy === 'transaction_date' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th>Account</th>
                <th>Type</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('amount')}>
                  Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th>Channel</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="tx-loading">
                      <div className="tx-spinner" />
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="tx-empty">
                      <p>No transactions found matching the selected criteria.</p>
                      <button
                        className="tx-btn tx-btn-ghost"
                        style={{ marginTop: 10 }}
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const typeCfg = TX_TYPE_CONFIG[tx.transaction_type] || TX_TYPE_CONFIG.deposit
                  const statusCfg = TX_STATUS_CONFIG[tx.status] || TX_STATUS_CONFIG.completed
                  const credit = isCredit(tx.transaction_type)
                  const highVal = isHighValue(Number(tx.amount))
                  const isPending = tx.status === 'pending'
                  const isFlagged = tx.status === 'flagged'

                  return (
                    <tr
                      key={tx.id}
                      className={`${isFlagged ? 'tx-row-flagged' : ''} ${highVal ? 'tx-row-high-value' : ''}`}
                    >
                      {/* ID / Number */}
                      <td>
                        <div className="tx-num-cell">
                          <div
                            className="tx-type-icon-box"
                            style={{ background: typeCfg.bg, color: typeCfg.color }}
                          >
                            {typeCfg.icon}
                          </div>
                          <div className="tx-num-meta">
                            <span
                              className="tx-num-text"
                              onClick={() => navigate(`/transactions/${tx.id}`)}
                            >
                              {tx.transaction_number}
                            </span>
                            {tx.description && (
                              <span className="tx-num-sub" title={tx.description}>
                                {tx.description.length > 25
                                  ? `${tx.description.substring(0, 25)}...`
                                  : tx.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {formatDate(tx.transaction_date)}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {tx.transaction_date?.split(' ')[1] || ''}
                        </div>
                      </td>

                      {/* Account */}
                      <td>
                        {tx.account ? (
                          <div>
                            <span
                              className="tx-account-link"
                              onClick={() => navigate(`/accounts/${tx.account?.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              {tx.account.account_number}
                            </span>
                            {tx.account.customer && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {tx.account.customer.full_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'Courier New, monospace', fontSize: '0.8rem' }}>
                            #{tx.account_id}
                          </span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span
                          className="tx-badge"
                          style={{
                            background: typeCfg.bg,
                            color: typeCfg.color,
                            border: `1px solid ${typeCfg.border}`,
                          }}
                        >
                          <span className="tx-badge-dot" />
                          {typeCfg.label}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className={credit ? 'tx-amount-credit' : 'tx-amount-debit'}>
                          {credit ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                        {highVal && <span className="tx-high-value-pill">≥ $10K</span>}
                      </td>

                      {/* Channel */}
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {getChannelLabel(tx.channel)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="tx-badge"
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.border}`,
                          }}
                        >
                          <span className="tx-badge-dot" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="tx-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="tx-icon-btn"
                            title="View details"
                            onClick={() => navigate(`/transactions/${tx.id}`)}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Approve (Admin & Manager when pending or flagged) */}
                          {allowApprove && (isPending || isFlagged) && (
                            <button
                              className="tx-icon-btn approve"
                              title="Approve Transaction"
                              disabled={actionLoadingId === tx.id}
                              onClick={(e) => handleApprove(tx, e)}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                          {/* Flag (Admin, Manager, Compliance when completed or pending) */}
                          {allowFlag && !isFlagged && (
                            <button
                              className="tx-icon-btn flag"
                              title="Flag as Suspicious"
                              disabled={actionLoadingId === tx.id}
                              onClick={(e) => handleFlag(tx, e)}
                            >
                              <AlertTriangle size={14} />
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
          <div className="tx-pagination">
            <span>
              Showing <strong>{(meta.current_page - 1) * meta.per_page + 1}</strong> to{' '}
              <strong>{Math.min(meta.current_page * meta.per_page, meta.total)}</strong> of{' '}
              <strong>{meta.total}</strong> records
            </span>
            <div className="tx-page-controls">
              <button
                className="tx-page-btn"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === meta.last_page ||
                    Math.abs(p - meta.current_page) <= 1
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>…</span>}
                    <button
                      className={`tx-page-btn ${p === meta.current_page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                className="tx-page-btn"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      {showRecordModal && (
        <RecordTransactionModal
          onClose={() => setShowRecordModal(false)}
          onSuccess={() => {
            setShowRecordModal(false)
            fetchTransactions()
          }}
        />
      )}
    </div>
  )
}
