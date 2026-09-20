import { showToast, useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useCallback } from 'react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  DollarSign,
  ExternalLink,
} from 'lucide-react'
import { transactionsApi } from '@/features/transactions/api/transactions'
import type { Transaction } from '@/features/transactions/types'
import {
  TX_TYPE_CONFIG,
  TX_STATUS_CONFIG,
  formatCurrency,
  formatDateTime,
  isCredit,
  isHighValue,
  canApproveTransaction,
  canFlagTransaction,
  getChannelLabel,
} from '../transactionHelpers'
import './TransactionManagement.css'

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowApprove = canApproveTransaction(role)
  const allowFlag = canFlagTransaction(role)
  const isCompliance = role === 'compliance'

  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTx = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await transactionsApi.get(id)
      setTx(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transaction details.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchTx() }, 0)
    return () => clearTimeout(timer)
  }, [fetchTx])

  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel: string; danger: boolean; run: () => Promise<void> } | null>(null)

  const handleApprove = () => {
    if (!tx) return
    setConfirm({
      title: 'Approve transaction',
      message: `Are you sure you want to approve transaction ${tx.transaction_number}?`,
      confirmLabel: 'Approve',
      danger: false,
      run: async () => {
        setActionLoading(true)
        try {
          const updated = await transactionsApi.approve(tx.id)
          setTx(updated)
          showToast.success('Transaction approved successfully!')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to approve transaction.'
          showToast.error(msg)
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleFlag = () => {
    if (!tx) return
    setConfirm({
      title: 'Flag transaction',
      message: `Flag transaction ${tx.transaction_number} as suspicious for compliance review?`,
      confirmLabel: 'Flag',
      danger: true,
      run: async () => {
        setActionLoading(true)
        try {
          const updated = await transactionsApi.flag(tx.id)
          setTx(updated)
          showToast.success('Transaction flagged for review.')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to flag transaction.'
          showToast.error(msg)
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="tx-page">
        <div className="tx-loading" style={{ minHeight: '50vh' }}>
          <div className="tx-spinner" />
          <span>Loading transaction details...</span>
        </div>
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="tx-page">
        <div className="tx-empty" style={{ minHeight: '50vh' }}>
          <p>Transaction not found or you do not have permission to view it.</p>
          <button className="tx-btn tx-btn-ghost" onClick={() => navigate('/transactions')}>
            <ArrowLeft size={15} /> Back to Transactions
          </button>
        </div>
      </div>
    )
  }

  const typeCfg = TX_TYPE_CONFIG[tx.transaction_type] || TX_TYPE_CONFIG.deposit
  const statusCfg = TX_STATUS_CONFIG[tx.status] || TX_STATUS_CONFIG.completed
  const credit = isCredit(tx.transaction_type)
  const highVal = isHighValue(Number(tx.amount))
  const isPending = tx.status === 'pending'
  const isFlagged = tx.status === 'flagged'
  const isFailed = tx.status === 'failed'
  const canFlag = !isFlagged && !isFailed

  return (
    <div className="tx-page-wrap">
      <div className="tx-page">
        {/* Top back button */}
      <div>
        <button className="tx-back-btn" onClick={() => navigate('/transactions')}>
          <ArrowLeft size={16} /> Back to Transactions
        </button>
      </div>

      {/* Compliance banner */}
      {isCompliance && (
        <div className="tx-compliance-banner">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Compliance Audit Mode:</strong> You are reviewing this transaction under AML / Fraud prevention
            regulations.
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="tx-detail-header">
        <div className="tx-detail-hero">
          <div
            className="tx-detail-icon"
            style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}` }}
          >
            {typeCfg.icon}
          </div>
          <div className="tx-detail-title">
            <h2>{tx.transaction_number}</h2>
            <p>
              {typeCfg.label} • {formatDateTime(tx.transaction_date)} • Channel:{' '}
              {getChannelLabel(tx.channel)}
            </p>
          </div>
        </div>

        <div className="tx-detail-actions">
          {/* Status Badge */}
          <span
            className="tx-badge"
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
            }}
          >
            <span className="tx-badge-dot" />
            {statusCfg.label}
          </span>

          {highVal && <span className="tx-high-value-pill" style={{ padding: '0.35rem 0.65rem' }}>HIGH-VALUE (≥ $10K)</span>}

          {/* Approve Button */}
          {allowApprove && (isPending || isFlagged) && (
            <button
              className="tx-btn tx-btn-success"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              <CheckCircle size={15} /> Approve Transaction
            </button>
          )}

          {/* Flag Button */}
          {allowFlag && canFlag && (
            <button
              className="tx-btn tx-btn-danger"
              onClick={handleFlag}
              disabled={actionLoading}
            >
              <AlertTriangle size={15} /> Flag Suspicious
            </button>
          )}

          <button className="tx-btn tx-btn-ghost" onClick={fetchTx} title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="tx-info-grid">
        {/* Card 1: Transaction Information */}
        <div className="tx-info-card">
          <h3>
            <DollarSign size={16} /> Transaction Details
          </h3>

          <div className="tx-info-row">
            <span className="tx-info-label">Transaction ID</span>
            <span className="tx-info-value mono">{tx.transaction_number}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Type</span>
            <span
              className="tx-badge"
              style={{
                background: typeCfg.bg,
                color: typeCfg.color,
                border: `1px solid ${typeCfg.border}`,
              }}
            >
              {typeCfg.label}
            </span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Amount</span>
            <span
              className={`tx-info-value ${credit ? 'tx-amount-credit' : 'tx-amount-debit'}`}
              style={{ fontSize: '1.05rem' }}
            >
              {credit ? '+' : '-'}
              {formatCurrency(tx.amount, tx.currency)}
            </span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Currency</span>
            <span className="tx-info-value">{tx.currency ?? 'TND'}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Execution Date</span>
            <span className="tx-info-value">{formatDateTime(tx.transaction_date)}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Channel</span>
            <span className="tx-info-value">{getChannelLabel(tx.channel)}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Counterparty</span>
            <span className="tx-info-value">{tx.counterparty || 'N/A (Direct Branch/ATM)'}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Description / Memo</span>
            <span className="tx-info-value" style={{ maxWidth: '60%', textAlign: 'right' }}>
              {tx.description || 'None provided'}
            </span>
          </div>
        </div>

        {/* Card 2: Account & Customer Information */}
        <div className="tx-info-card">
          <h3>
            <CreditCard size={16} /> Linked Bank Account
          </h3>

          {tx.account ? (
            <>
              <div className="tx-info-row">
                <span className="tx-info-label">Account Number</span>
                <Link
                  to={`/accounts/${tx.account.id}`}
                  className="tx-account-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {tx.account.account_number} <ExternalLink size={12} />
                </Link>
              </div>

              <div className="tx-info-row">
                <span className="tx-info-label">Account Type</span>
                <span className="tx-info-value" style={{ textTransform: 'capitalize' }}>
                  {tx.account.account_type} Account
                </span>
              </div>

              <div className="tx-info-row">
                <span className="tx-info-label">Current Balance</span>
                <span className="tx-info-value" style={{ color: '#10b981' }}>
                  {formatCurrency(tx.account.balance, tx.account.currency)}
                </span>
              </div>

              <div className="tx-info-row">
                <span className="tx-info-label">Account Status</span>
                <span className="tx-info-value" style={{ textTransform: 'capitalize' }}>
                  {tx.account.status}
                </span>
              </div>

              {tx.account.customer && (
                <>
                  <div className="tx-info-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                    <span className="tx-info-label">Account Holder</span>
                    <Link
                      to={`/customers/${tx.account.customer.id}`}
                      style={{ color: 'var(--primary-400)', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {tx.account.customer.full_name} <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div className="tx-info-row">
                    <span className="tx-info-label">Customer ID</span>
                    <span className="tx-info-value mono">{tx.account.customer.customer_number}</span>
                  </div>

                  {tx.account.customer.email && (
                    <div className="tx-info-row">
                      <span className="tx-info-label">Email</span>
                      <span className="tx-info-value">{tx.account.customer.email}</span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Account #{tx.account_id} details unavailable.
            </div>
          )}
        </div>

        {/* Card 3: Compliance & Approval Audit */}
        <div className="tx-info-card">
          <h3>
            <ShieldCheck size={16} /> Audit & Settlement
          </h3>

          <div className="tx-info-row">
            <span className="tx-info-label">Settlement Status</span>
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
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">High-Value Threshold</span>
            <span className="tx-info-value">
              {highVal ? (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Triggered (≥ $10,000)</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Standard</span>
              )}
            </span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Approved By</span>
            <span className="tx-info-value">
              {tx.approver ? (
                <span>
                  {tx.approver.name}{' '}
                  {tx.approver.role && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({tx.approver.role})
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {tx.status === 'completed' ? 'System Settled / Standard' : 'Pending Approval'}
                </span>
              )}
            </span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Approved At</span>
            <span className="tx-info-value">
              {tx.approved_at ? formatDateTime(tx.approved_at) : '-'}
            </span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Created At</span>
            <span className="tx-info-value">{formatDateTime(tx.created_at)}</span>
          </div>

          <div className="tx-info-row">
            <span className="tx-info-label">Last Updated</span>
            <span className="tx-info-value">{formatDateTime(tx.updated_at)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={() => { confirm?.run() }}
        onCancel={() => setConfirm(null)}
      />
      </div>
    </div>
  )
}
