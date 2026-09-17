import { showToast, useAuth } from '@/shared/hooks'
import { toAmountNumber } from '@/shared/utils'
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, User, Percent, RefreshCw,
  Pencil, Snowflake, XCircle, Activity, AlertTriangle,
} from 'lucide-react'

import { accountsApi } from '@/features/accounts/api/accounts'
import type { BankAccount } from '@/features/accounts/types'
import {
  ACCOUNT_TYPE_CONFIG,
  ACCOUNT_STATUS_CONFIG,
  formatCurrency,
  formatDate,
  formatDateTime,
  getAvatarColor,
  canEditAccount,
  canFreezeAccount,
  canCloseAccount,
} from '../accountHelpers'
import { EditAccountModal } from '../modals/EditAccountModal'
import { FreezeAccountModal } from '../modals/FreezeAccountModal'
import { CloseAccountModal } from '../modals/CloseAccountModal'
import './AccountManagement.css'

interface Transaction {
  id: number
  transaction_number?: string
  type: string
  amount: number
  currency?: string
  status: string
  channel?: string
  description?: string
  transaction_date?: string
  created_at?: string
}

const TX_TYPE_COLOR: Record<string, string> = {
  deposit: '#10b981',
  withdrawal: '#f43f5e',
  transfer: '#6366f1',
  fee: '#f59e0b',
  interest: '#06b6d4',
}

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowEdit   = canEditAccount(role)
  const allowFreeze = canFreezeAccount(role)
  const allowClose  = canCloseAccount(role)

  const [account, setAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)

  // Transactions
  const [transactions, setTransactions]       = useState<Transaction[]>([])
  const [txLoading, setTxLoading]             = useState(false)
  const [txPage, setTxPage]                   = useState(1)
  const [txTypeFilter, setTxTypeFilter]       = useState('')
  const [txStatusFilter, setTxStatusFilter]   = useState('')

  // Modals
  const [showEditModal, setShowEditModal]     = useState(false)
  const [showFreezeModal, setShowFreezeModal] = useState(false)
  const [showCloseModal, setShowCloseModal]   = useState(false)

  const fetchAccount = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await accountsApi.get(id)
      setAccount(data)
    } catch {
      showToast.error('Failed to load account details.')
      navigate('/accounts')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  const fetchTransactions = useCallback(async () => {
    if (!id) return
    setTxLoading(true)
    try {
      const res = await accountsApi.transactions(id, {
        type: txTypeFilter || undefined,
        status: txStatusFilter || undefined,
        page: txPage,
      })
      // Handle both paginated and non-paginated responses
      if (Array.isArray(res)) {
        setTransactions(res)
      } else if (res?.data && Array.isArray(res.data)) {
        setTransactions(res.data)
      } else {
        setTransactions([])
      }
    } catch {
      showToast.error('Failed to load transactions.')
    } finally {
      setTxLoading(false)
    }
  }, [id, txTypeFilter, txStatusFilter, txPage])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchAccount() }, 0)
    return () => clearTimeout(timer)
  }, [fetchAccount])
  useEffect(() => {
    const timer = setTimeout(() => { void fetchTransactions() }, 0)
    return () => clearTimeout(timer)
  }, [fetchTransactions])

  const handleModalSuccess = () => {
    setShowEditModal(false)
    setShowFreezeModal(false)
    setShowCloseModal(false)
    fetchAccount()
  }

  if (loading) {
    return (
      <div className="am-page">
        <div className="am-loading" style={{ minHeight: '40vh' }}>
          <div className="am-spinner" />
          <span>Loading account details…</span>
        </div>
      </div>
    )
  }

  if (!account) return null

  const typeCfg   = ACCOUNT_TYPE_CONFIG[account.account_type] || ACCOUNT_TYPE_CONFIG.savings
  const statusCfg = ACCOUNT_STATUS_CONFIG[account.status] || ACCOUNT_STATUS_CONFIG.active
  const isClosed  = account.status === 'closed'
  const isFrozen  = account.status === 'frozen'

  return (
    <div className="am-page">
      {/* Back */}
      <button className="am-back-btn" onClick={() => navigate('/accounts')}>
        <ArrowLeft size={15} /> Back to Accounts
      </button>

      {/* Detail Header */}
      <div className="am-detail-header">
        <div className="am-detail-hero">
          <div
            className="am-detail-avatar"
            style={{ background: getAvatarColor(account.account_number) }}
          >
            {account.account_type.slice(0, 2).toUpperCase()}
          </div>
          <div className="am-detail-title">
            <h2>{account.account_number}</h2>
            <p>
              <span
                className="am-badge"
                style={{
                  color: typeCfg.color,
                  background: typeCfg.bg,
                  border: `1px solid ${typeCfg.border}`,
                  marginRight: '0.5rem',
                }}
              >
                {typeCfg.label}
              </span>
              <span
                className="am-badge"
                style={{
                  color: statusCfg.color,
                  background: statusCfg.bg,
                  border: `1px solid ${statusCfg.border}`,
                }}
              >
                <span className="am-badge-dot" />
                {statusCfg.label}
              </span>
            </p>
          </div>
        </div>

        <div className="am-detail-actions">
          <button className="am-btn am-btn-ghost" onClick={fetchAccount}>
            <RefreshCw size={14} /> Refresh
          </button>
          {allowEdit && !isClosed && (
            <button className="am-btn am-btn-ghost" onClick={() => setShowEditModal(true)}>
              <Pencil size={14} /> Edit
            </button>
          )}
          {allowFreeze && !isClosed && (
            <button
              className="am-btn am-btn-ghost"
              onClick={() => setShowFreezeModal(true)}
              style={isFrozen ? { color: 'var(--emerald-500)' } : { color: 'var(--amber-500)' }}
            >
              <Snowflake size={14} />
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </button>
          )}
          {allowClose && !isClosed && (
            <button className="am-btn am-btn-danger" onClick={() => setShowCloseModal(true)}>
              <XCircle size={14} /> Close Account
            </button>
          )}
        </div>
      </div>

      {/* Closed / Frozen Notice */}
      {isClosed && (
        <div className="am-danger-box">
          <p>
            <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            <strong>Account Closed</strong> - This account has been permanently closed.
            No transactions can be processed.
          </p>
        </div>
      )}
      {isFrozen && (
        <div className="am-notice-box">
          <p>
            <Snowflake size={14} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--amber-500)' }} />
            This account is currently <strong>frozen</strong>. Transactions are suspended until
            unfrozen by an authorized user.
          </p>
        </div>
      )}

      {/* Info Grid */}
      <div className="am-info-grid">
        {/* Account Information */}
        <div className="am-info-card">
          <h3><CreditCard size={14} /> Account Information</h3>
          <div className="am-info-row">
            <span className="am-info-label">Account Number</span>
            <span className="am-info-value mono">{account.account_number}</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Account Type</span>
            <span className="am-info-value">{typeCfg.label}</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Currency</span>
            <span className="am-info-value">{account.currency}</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Current Balance</span>
            <span className="am-info-value" style={{ color: toAmountNumber(account.balance) > 0 ? 'var(--emerald-500)' : 'inherit', fontSize: '1rem' }}>
              {formatCurrency(account.balance, account.currency)}
            </span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Status</span>
            <span
              className="am-badge"
              style={{
                color: statusCfg.color,
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.border}`,
              }}
            >
              <span className="am-badge-dot" />
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Account Details */}
        <div className="am-info-card">
          <h3><Percent size={14} /> Financial Details</h3>
          <div className="am-info-row">
            <span className="am-info-label">Interest Rate</span>
            <span className="am-info-value">{account.interest_rate}% p.a.</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Opened Date</span>
            <span className="am-info-value">{formatDate(account.opened_date)}</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Created At</span>
            <span className="am-info-value">{formatDateTime(account.created_at)}</span>
          </div>
          <div className="am-info-row">
            <span className="am-info-label">Last Updated</span>
            <span className="am-info-value">{formatDateTime(account.updated_at)}</span>
          </div>
        </div>

        {/* Customer Information */}
        {account.customer && (
          <div className="am-info-card">
            <h3><User size={14} /> Customer Information</h3>
            <div className="am-info-row">
              <span className="am-info-label">Full Name</span>
              <span
                className="am-info-value"
                style={{ cursor: 'pointer', color: 'var(--primary-400)' }}
                onClick={() => navigate(`/customers/${account.customer_id}`)}
              >
                {account.customer.full_name}
              </span>
            </div>
            <div className="am-info-row">
              <span className="am-info-label">Customer #</span>
              <span className="am-info-value mono">{account.customer.customer_number}</span>
            </div>
            <div className="am-info-row">
              <span className="am-info-label">Email</span>
              <span className="am-info-value">{account.customer.email}</span>
            </div>
            <div className="am-info-row">
              <span className="am-info-label">Phone</span>
              <span className="am-info-value">{account.customer.phone || '-'}</span>
            </div>
            <div className="am-info-row">
              <span className="am-info-label">Customer Type</span>
              <span className="am-info-value" style={{ textTransform: 'capitalize' }}>
                {account.customer.customer_type || '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="am-tx-card">
        <div className="am-tx-header">
          <h3><Activity size={15} /> Transaction History</h3>
          <div className="am-tx-filters">
            <select
              className="am-filter-select"
              value={txTypeFilter}
              onChange={(e) => { setTxTypeFilter(e.target.value); setTxPage(1) }}
              style={{ minWidth: 140 }}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="fee">Fee</option>
              <option value="interest">Interest</option>
            </select>
            <select
              className="am-filter-select"
              value={txStatusFilter}
              onChange={(e) => { setTxStatusFilter(e.target.value); setTxPage(1) }}
              style={{ minWidth: 130 }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              className="am-btn am-btn-ghost"
              onClick={fetchTransactions}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <RefreshCw size={14} className={txLoading ? 'am-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="am-table-wrapper">
          <table className="am-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Reference</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="am-loading">
                      <div className="am-spinner" />
                      <span>Loading transactions…</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="am-empty">
                      <Activity size={32} color="var(--text-muted)" />
                      <p>No transactions found for this account.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.type === 'deposit' || tx.type === 'interest'
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(tx.transaction_date || tx.created_at)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {tx.transaction_number || `#${tx.id}`}
                        </span>
                      </td>
                      <td>
                        <span
                          className="am-badge"
                          style={{
                            color: TX_TYPE_COLOR[tx.type] || 'var(--text-muted)',
                            background: `${TX_TYPE_COLOR[tx.type] || '#94a3b8'}18`,
                            border: `1px solid ${TX_TYPE_COLOR[tx.type] || '#94a3b8'}30`,
                            textTransform: 'capitalize',
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {tx.channel || '-'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={isCredit ? 'am-amount-credit' : 'am-amount-debit'}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || account.currency)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="am-badge"
                          style={{
                            color: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#f43f5e',
                            background: tx.status === 'completed' ? 'rgba(16,185,129,0.1)' : tx.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                            border: `1px solid ${tx.status === 'completed' ? 'rgba(16,185,129,0.25)' : tx.status === 'pending' ? 'rgba(245,158,11,0.25)' : 'rgba(244,63,94,0.25)'}`,
                            textTransform: 'capitalize',
                          }}
                        >
                          <span className="am-badge-dot" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction pagination controls */}
        {transactions.length >= 15 && (
          <div className="am-pagination">
            <span>Page {txPage}</span>
            <div className="am-page-controls">
              <button className="am-page-btn" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)}>
                ← Prev
              </button>
              <button className="am-page-btn active">{txPage}</button>
              <button className="am-page-btn" onClick={() => setTxPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditAccountModal
          account={account}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      {showFreezeModal && (
        <FreezeAccountModal
          account={account}
          onClose={() => setShowFreezeModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      {showCloseModal && (
        <CloseAccountModal
          account={account}
          onClose={() => setShowCloseModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
