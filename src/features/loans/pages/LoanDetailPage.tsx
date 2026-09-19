import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Edit3,
  RefreshCw,
  ShieldAlert,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { loansApi } from '@/api/loans'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Loan } from '@/types/loan'
import {
  LOAN_TYPE_CONFIG,
  LOAN_STATUS_CONFIG,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  calculateMonthlyPayment,
  calculateTotalInterest,
  calculateRepaymentProgress,
  generateAmortizationSchedule,
  canApproveLoan,
  canUpdateLoan,
  isComplianceRole,
} from './loanHelpers'
import { UpdateLoanModal } from './modals/UpdateLoanModal'
import './LoanManagement.css'

export const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowApprove = canApproveLoan(role)
  const allowUpdate = canUpdateLoan(role)
  const isCompliance = isComplianceRole(role)

  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const fetchLoan = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await loansApi.get(id)
      setLoan(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch loan details.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLoan()
  }, [fetchLoan])

  const handleApprove = async () => {
    if (!loan) return
    if (!window.confirm(`Approve loan ${loan.loan_number} and disburse funds?`)) return
    setActionLoading(true)
    try {
      const updated = await loansApi.approve(loan.id)
      setLoan(updated)
      showToast.success('Loan approved and activated!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve loan.'
      showToast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ln-page">
        <div className="ln-loading" style={{ minHeight: '50vh' }}>
          <div className="ln-spinner" />
          <span>Loading loan profile...</span>
        </div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="ln-page">
        <div className="ln-empty" style={{ minHeight: '50vh' }}>
          <p>Loan record not found or you do not have permission to view it.</p>
          <button className="ln-btn ln-btn-ghost" onClick={() => navigate('/loans')}>
            <ArrowLeft size={15} /> Back to Loans
          </button>
        </div>
      </div>
    )
  }

  const typeCfg = LOAN_TYPE_CONFIG[loan.loan_type] || LOAN_TYPE_CONFIG.personal
  const statusCfg = LOAN_STATUS_CONFIG[loan.status] || LOAN_STATUS_CONFIG.active
  const isPending = loan.status === 'pending'
  const progressPct = calculateRepaymentProgress(loan.principal_amount, loan.outstanding_balance)
  const monthlyInstallment = calculateMonthlyPayment(
    loan.principal_amount,
    loan.interest_rate,
    loan.term_months
  )
  const totalInterest = calculateTotalInterest(
    loan.principal_amount,
    monthlyInstallment,
    loan.term_months
  )
  const schedule = generateAmortizationSchedule(
    loan.principal_amount,
    loan.interest_rate,
    loan.term_months,
    loan.start_date,
    12
  )

  return (
    <div className="ln-page">
      {/* Top back button */}
      <div>
        <button className="ln-back-btn" onClick={() => navigate('/loans')}>
          <ArrowLeft size={16} /> Back to Loan Portfolio
        </button>
      </div>

      {/* Compliance Notice */}
      {isCompliance && (
        <div className="ln-compliance-banner">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Compliance Audit Scope:</strong> This facility is under compliance monitoring due to its risk classification.
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="ln-detail-header">
        <div className="ln-detail-hero">
          <div
            className="ln-detail-icon"
            style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}` }}
          >
            {typeCfg.icon}
          </div>
          <div className="ln-detail-title">
            <h2>{loan.loan_number}</h2>
            <p>
              {typeCfg.label} • Disbursed {formatDate(loan.start_date)} • Term: {loan.term_months} Months
            </p>
          </div>
        </div>

        <div className="ln-detail-actions">
          {/* Status Badge */}
          <span
            className="ln-badge"
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
            }}
          >
            <span className="ln-badge-dot" />
            {statusCfg.label}
          </span>

          {/* Quick Approve (Admin/Manager when pending) */}
          {allowApprove && isPending && (
            <button
              className="ln-btn ln-btn-success"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              <CheckCircle size={15} /> Approve & Activate
            </button>
          )}

          {/* Quick Update (Admin/Manager) */}
          {allowUpdate && (
            <button
              className="ln-btn ln-btn-ghost"
              onClick={() => setShowUpdateModal(true)}
            >
              <Edit3 size={15} /> Update Loan / Payment
            </button>
          )}

          <button className="ln-btn ln-btn-ghost" onClick={fetchLoan} title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="ln-info-grid">
        {/* Card 1: Financial Overview */}
        <div className="ln-info-card">
          <h3>
            <DollarSign size={16} /> Financial Terms & Balances
          </h3>

          <div className="ln-info-row">
            <span className="ln-info-label">Principal Amount</span>
            <strong className="ln-info-value" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
              {formatCurrency(loan.principal_amount)}
            </strong>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Outstanding Balance</span>
            <strong className="ln-info-value" style={{ fontSize: '1.05rem', color: '#0284c7' }}>
              {formatCurrency(loan.outstanding_balance)}
            </strong>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Repayment Progress</span>
            <div style={{ width: '50%', minWidth: 140 }}>
              <div className="ln-progress-bar">
                <div className="ln-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="ln-progress-text" style={{ marginTop: 3 }}>
                <span>{progressPct}% paid</span>
                <span>{formatCurrency(loan.principal_amount - loan.outstanding_balance)}</span>
              </div>
            </div>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Interest Rate (APR)</span>
            <span className="ln-info-value">{formatPercent(loan.interest_rate)}</span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Estimated Monthly Installment</span>
            <span className="ln-info-value" style={{ color: '#6366f1', fontWeight: 700 }}>
              {formatCurrency(monthlyInstallment)}/mo
            </span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Est. Total Interest Over Term</span>
            <span className="ln-info-value">{formatCurrency(totalInterest)}</span>
          </div>
        </div>

        {/* Card 2: Customer Profile */}
        <div className="ln-info-card">
          <h3>
            <User size={16} /> Borrower Information
          </h3>

          {loan.customer ? (
            <>
              <div className="ln-info-row">
                <span className="ln-info-label">Borrower Name</span>
                <Link
                  to={`/customers/${loan.customer.id}`}
                  style={{
                    color: 'var(--primary-400)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {loan.customer.full_name} <ExternalLink size={12} />
                </Link>
              </div>

              <div className="ln-info-row">
                <span className="ln-info-label">Customer ID</span>
                <span className="ln-info-value mono">{loan.customer.customer_number}</span>
              </div>

              <div className="ln-info-row">
                <span className="ln-info-label">Customer Type</span>
                <span className="ln-info-value" style={{ textTransform: 'capitalize' }}>
                  {loan.customer.customer_type || 'Individual'}
                </span>
              </div>

              <div className="ln-info-row">
                <span className="ln-info-label">Email</span>
                <span className="ln-info-value">{loan.customer.email || '-'}</span>
              </div>

              <div className="ln-info-row">
                <span className="ln-info-label">Phone</span>
                <span className="ln-info-value">{loan.customer.phone || '-'}</span>
              </div>

              <div className="ln-info-row">
                <span className="ln-info-label">Home Branch</span>
                <span className="ln-info-value">
                  {loan.customer.branch?.branch_name || `Branch #${loan.customer.branch_id || 1}`}
                </span>
              </div>
            </>
          ) : (
            <div style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
              Customer record unavailable.
            </div>
          )}
        </div>

        {/* Card 3: Lifecycle & Schedule Information */}
        <div className="ln-info-card">
          <h3>
            <Clock size={16} /> Key Dates & Milestones
          </h3>

          <div className="ln-info-row">
            <span className="ln-info-label">Origination / Start Date</span>
            <span className="ln-info-value">{formatDate(loan.start_date)}</span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Maturity / End Date</span>
            <span className="ln-info-value">{formatDate(loan.end_date)}</span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Next Payment Due Date</span>
            <span
              className="ln-info-value"
              style={{
                color: loan.status === 'delinquent' ? '#f97316' : 'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              {formatDate(loan.next_payment_date)}
            </span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Application Logged</span>
            <span className="ln-info-value">{formatDateTime(loan.created_at)}</span>
          </div>

          <div className="ln-info-row">
            <span className="ln-info-label">Last Record Update</span>
            <span className="ln-info-value">{formatDateTime(loan.updated_at)}</span>
          </div>

          {/* Status Lifecycle Tracker */}
          <div style={{ marginTop: '1.25rem' }}>
            <span className="ln-info-label" style={{ display: 'block', marginBottom: 6 }}>
              Lifecycle Status
            </span>
            <div className="ln-lifecycle-tracker">
              <div
                className={`ln-lifecycle-step ${
                  loan.status === 'pending'
                    ? 'warning'
                    : ['active', 'delinquent', 'defaulted', 'completed'].includes(loan.status)
                    ? 'active'
                    : ''
                }`}
              >
                <div className="ln-lifecycle-node">1</div>
                <span className="ln-lifecycle-label">Pending</span>
              </div>

              <div
                className={`ln-lifecycle-step ${
                  loan.status === 'active'
                    ? 'active'
                    : ['delinquent', 'defaulted', 'completed'].includes(loan.status)
                    ? 'active'
                    : ''
                }`}
              >
                <div className="ln-lifecycle-node">2</div>
                <span className="ln-lifecycle-label">Active</span>
              </div>

              <div
                className={`ln-lifecycle-step ${
                  loan.status === 'delinquent' || loan.status === 'defaulted'
                    ? 'danger'
                    : loan.status === 'completed'
                    ? 'active'
                    : ''
                }`}
              >
                <div className="ln-lifecycle-node">3</div>
                <span className="ln-lifecycle-label">Risk Review</span>
              </div>

              <div
                className={`ln-lifecycle-step ${loan.status === 'completed' ? 'active' : ''}`}
              >
                <div className="ln-lifecycle-node">4</div>
                <span className="ln-lifecycle-label">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule Table Card */}
      <div className="ln-schedule-card">
        <div className="ln-schedule-header">
          <h3>
            <Calendar size={16} /> Projected Amortization Schedule (First 12 Months)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calculated at {formatPercent(loan.interest_rate)} APR
          </span>
        </div>
        <div className="ln-table-wrapper">
          <table className="ln-table">
            <thead>
              <tr>
                <th>Pmt #</th>
                <th>Due Date</th>
                <th>Payment Amount</th>
                <th>Principal Portion</th>
                <th>Interest Portion</th>
                <th>Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.paymentNumber}>
                  <td>
                    <strong>#{item.paymentNumber}</strong>
                  </td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td>
                    <strong style={{ color: '#10b981' }}>
                      {formatCurrency(item.paymentAmount)}
                    </strong>
                  </td>
                  <td>{formatCurrency(item.principalPart)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(item.interestPart)}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 600 }}>
                      {formatCurrency(item.remainingBalance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateLoanModal
          loan={loan}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false)
            fetchLoan()
          }}
        />
      )}
    </div>
  )
}
