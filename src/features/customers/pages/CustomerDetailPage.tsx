import { showToast, useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin,
  Building, Calendar, CreditCard, HandCoins, ArrowLeftRight,
  RefreshCw, UserCheck
} from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import { branchesApi } from '@/features/branches/api/branches'
import type {
  Customer,
  CustomerAccount,
  CustomerLoan,
  CustomerTransaction,
} from '@/features/customers/types'
import type { Branch } from '@/shared/types/user'
import {
  CUSTOMER_TYPE_LABELS,
  KYC_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  getAvatarColor,
  canEditCustomer,
  canDeleteCustomer,
} from '../customerHelpers'
import { EditCustomerModal } from '../modals/EditCustomerModal'
import { DeleteCustomerModal } from '../modals/DeleteCustomerModal'
import './CustomerManagement.css'

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowEdit   = canEditCustomer(role)
  const allowDelete = canDeleteCustomer(role)

  // Data State
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading]   = useState(true)

  // Tab State
  const [activeTab, setActiveTab] = useState<'accounts' | 'loans' | 'transactions'>('accounts')

  // Sub-resource lists
  const [accounts, setAccounts]         = useState<CustomerAccount[]>([])
  const [loans, setLoans]               = useState<CustomerLoan[]>([])
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
  const [tabLoading, setTabLoading]     = useState(false)

  // Modals
  const [showEditModal, setShowEditModal]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Load branches
  useEffect(() => {
    branchesApi
      .list({ per_page: 100 })
      .then((res) => setBranches(res.data))
      .catch(() => {})
  }, [])

  // Fetch Customer Record
  const fetchCustomer = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await customersApi.get(id)
      setCustomer(data)
    } catch (err) {
      showToast.error('Customer not found or access restricted.')
      navigate('/customers')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchCustomer() }, 0)
    return () => clearTimeout(timer)
  }, [fetchCustomer])

  // Fetch Tab Specific Sub-resources
  const fetchSubResources = useCallback(async () => {
    if (!id) return
    setTabLoading(true)
    try {
      if (activeTab === 'accounts') {
        const data = await customersApi.accounts(id)
        setAccounts(data || [])
      } else if (activeTab === 'loans') {
        const data = await customersApi.loans(id)
        setLoans(data || [])
      } else if (activeTab === 'transactions') {
        const data = await customersApi.transactions(id)
        setTransactions(data || [])
      }
    } catch (err: unknown) {
      // Graceful fallback
      console.error('Failed to load sub-resource:', err)
    } finally {
      setTabLoading(false)
    }
  }, [id, activeTab])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchSubResources() }, 0)
    return () => clearTimeout(timer)
  }, [fetchSubResources])

  if (loading || !customer) {
    return (
      <div className="cm-page">
        <div className="cm-loading" style={{ minHeight: '380px' }}>
          <div className="cm-spinner" />
          <span>Loading customer portfolio…</span>
        </div>
      </div>
    )
  }

  const kycCfg  = KYC_STATUS_CONFIG[customer.kyc_status] || KYC_STATUS_CONFIG.pending
  const riskCfg = RISK_LEVEL_CONFIG[customer.risk_level] || RISK_LEVEL_CONFIG.low

  return (
    <div className="cm-page">
      {/* Top Header / Breadcrumbs */}
      <div className="cm-page-header">
        <div className="cm-page-header-left">
          <button
            className="cm-btn cm-btn-ghost"
            onClick={() => navigate('/customers')}
            style={{ marginBottom: '0.75rem' }}
          >
            <ArrowLeft size={16} />
            Back to Customers
          </button>
          <h1>{customer.full_name}</h1>
          <p>
            Customer ID: <code>{customer.customer_number}</code> • Registered {formatDate(customer.registration_date)}
          </p>
        </div>

        <div className="cm-header-actions">
          {allowEdit && (
            <button
              className="cm-btn cm-btn-primary"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil size={15} />
              Edit Customer
            </button>
          )}

          {allowDelete && (
            <button
              className="cm-btn cm-btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={15} />
              Delete Customer
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Profile Card (Left) + Sub-resources (Right) */}
      <div className="cm-detail-grid">
        {/* Profile Card */}
        <div className="cm-profile-card">
          <div className="cm-profile-header">
            <div
              className="cm-profile-avatar"
              style={{ background: getAvatarColor(customer.full_name) }}
            >
              {getInitials(customer.full_name)}
            </div>
            <h2 className="cm-profile-name">{customer.full_name}</h2>
            <span className="cm-profile-number">{customer.customer_number}</span>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.35rem' }}>
              <span className={`cm-badge-type ${customer.customer_type}`}>
                {CUSTOMER_TYPE_LABELS[customer.customer_type] || customer.customer_type}
              </span>
              <span
                className="cm-badge"
                style={{
                  color: kycCfg.color,
                  background: kycCfg.bg,
                  border: `1px solid ${kycCfg.border}`,
                }}
              >
                <span className="cm-badge-dot" />
                {kycCfg.label}
              </span>
              <span
                className="cm-badge"
                style={{
                  color: riskCfg.color,
                  background: riskCfg.bg,
                  border: `1px solid ${riskCfg.border}`,
                }}
              >
                {riskCfg.label}
              </span>
            </div>
          </div>

          <div className="cm-profile-meta">
            <div className="cm-meta-row">
              <span className="cm-meta-label"><Mail size={14} /> Email</span>
              <span className="cm-meta-value">{customer.email}</span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><Phone size={14} /> Phone</span>
              <span className="cm-meta-value">{customer.phone}</span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><Building size={14} /> Branch</span>
              <span className="cm-meta-value">{customer.branch?.branch_name || 'Global'}</span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><MapPin size={14} /> City / Region</span>
              <span className="cm-meta-value">{customer.city || '-'}</span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><MapPin size={14} /> Address</span>
              <span className="cm-meta-value">{customer.address || '-'}</span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><UserCheck size={14} /> Relationship Mgr</span>
              <span className="cm-meta-value">
                {customer.relationship_manager ? (
                  // Roles with users-list access can click through to the user profile
                  role && ['admin', 'manager', 'compliance', 'analyst', 'auditor'].includes(role) ? (
                    <Link
                      to={`/users/${customer.relationship_manager.id}`}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                      title={`View ${customer.relationship_manager.name}'s profile`}
                    >
                      {customer.relationship_manager.name}
                    </Link>
                  ) : (
                    customer.relationship_manager.name
                  )
                ) : (
                  <span style={{ opacity: 0.55 }}>Unassigned</span>
                )}
              </span>
            </div>

            <div className="cm-meta-row">
              <span className="cm-meta-label"><Calendar size={14} /> Registered</span>
              <span className="cm-meta-value">{formatDate(customer.registration_date)}</span>
            </div>
          </div>

          {allowEdit && (
            <div className="cm-profile-actions">
              <button
                className="cm-btn cm-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowEditModal(true)}
              >
                <Pencil size={15} />
                Modify Profile
              </button>
            </div>
          )}
        </div>

        {/* Right Content Area: Tabs */}
        <div>
          <div className="cm-tabs">
            <button
              className={`cm-tab ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              <CreditCard size={16} />
              Bank Accounts ({customer.accounts_count ?? accounts.length})
            </button>

            <button
              className={`cm-tab ${activeTab === 'loans' ? 'active' : ''}`}
              onClick={() => setActiveTab('loans')}
            >
              <HandCoins size={16} />
              Loan Facilities ({customer.loans_count ?? loans.length})
            </button>

            <button
              className={`cm-tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <ArrowLeftRight size={16} />
              Recent Transactions
            </button>
          </div>

          <div className="cm-tab-content">
            {/* Tab 1: Bank Accounts */}
            {activeTab === 'accounts' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Customer Accounts
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Deposit and savings accounts belonging to {customer.full_name}.
                    </p>
                  </div>
                  <button
                    className="cm-btn cm-btn-ghost"
                    onClick={fetchSubResources}
                    disabled={tabLoading}
                  >
                    <RefreshCw size={14} className={tabLoading ? 'cm-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {tabLoading ? (
                  <div className="cm-loading">
                    <div className="cm-spinner" />
                    <span>Loading accounts…</span>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="cm-empty">
                    <CreditCard size={36} color="var(--text-muted)" />
                    <p>No bank accounts open for this customer.</p>
                  </div>
                ) : (
                  <div className="cm-table-wrapper">
                    <table className="cm-table">
                      <thead>
                        <tr>
                          <th>Account Number</th>
                          <th>Account Type</th>
                          <th>Currency</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Opened Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((acc) => (
                          <tr key={acc.id}>
                            <td>
                              <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {acc.account_number}
                              </code>
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                {acc.account_type}
                              </span>
                            </td>
                            <td>{acc.currency}</td>
                            <td>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: Number(acc.balance) > 0 ? 'var(--emerald-500)' : 'var(--text-primary)',
                                }}
                              >
                                {formatCurrency(acc.balance)}
                              </span>
                            </td>
                            <td>
                              <span
                                className="cm-badge"
                                style={{
                                  background: acc.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                                  color: acc.status === 'active' ? 'var(--emerald-500)' : 'var(--rose-500)',
                                  border: `1px solid ${acc.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                                }}
                              >
                                {acc.status}
                              </span>
                            </td>
                            <td>{formatDate(acc.opened_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Loans */}
            {activeTab === 'loans' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Loan Facilities & Credit Lines
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Active, pending, or settled loans for {customer.full_name}.
                    </p>
                  </div>
                  <button
                    className="cm-btn cm-btn-ghost"
                    onClick={fetchSubResources}
                    disabled={tabLoading}
                  >
                    <RefreshCw size={14} className={tabLoading ? 'cm-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {tabLoading ? (
                  <div className="cm-loading">
                    <div className="cm-spinner" />
                    <span>Loading loan facilities…</span>
                  </div>
                ) : loans.length === 0 ? (
                  <div className="cm-empty">
                    <HandCoins size={36} color="var(--text-muted)" />
                    <p>No loan facilities registered for this customer.</p>
                  </div>
                ) : (
                  <div className="cm-table-wrapper">
                    <table className="cm-table">
                      <thead>
                        <tr>
                          <th>Loan Reference</th>
                          <th>Facility Type</th>
                          <th>Principal</th>
                          <th>Outstanding</th>
                          <th>Rate</th>
                          <th>Term</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map((loan) => (
                          <tr key={loan.id}>
                            <td>
                              <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {loan.loan_number}
                              </code>
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                {loan.loan_type}
                              </span>
                            </td>
                            <td>
                              {formatCurrency(loan.principal_amount ?? loan.amount)}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: 'var(--amber-500)' }}>
                                {formatCurrency(loan.outstanding_balance ?? loan.amount)}
                              </span>
                            </td>
                            <td>{loan.interest_rate}%</td>
                            <td>{loan.term_months} mos</td>
                            <td>
                              <span
                                className="cm-badge"
                                style={{
                                  background: loan.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                  color: loan.status === 'active' ? 'var(--emerald-500)' : 'var(--amber-500)',
                                }}
                              >
                                {loan.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Recent Transactions */}
            {activeTab === 'transactions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Recent Transaction History
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Activity log across all accounts belonging to {customer.full_name}.
                    </p>
                  </div>
                  <button
                    className="cm-btn cm-btn-ghost"
                    onClick={fetchSubResources}
                    disabled={tabLoading}
                  >
                    <RefreshCw size={14} className={tabLoading ? 'cm-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {tabLoading ? (
                  <div className="cm-loading">
                    <div className="cm-spinner" />
                    <span>Loading transactions…</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="cm-empty">
                    <ArrowLeftRight size={36} color="var(--text-muted)" />
                    <p>No recent transaction activity recorded.</p>
                  </div>
                ) : (
                  <div className="cm-table-wrapper">
                    <table className="cm-table">
                      <thead>
                        <tr>
                          <th>Date / Time</th>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Channel</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => {
                          const isDeposit = txn.transaction_type === 'deposit'
                          return (
                            <tr key={txn.id}>
                              <td>{formatDateTime(txn.transaction_date)}</td>
                              <td>
                                <code>{txn.reference_number || `#${txn.id}`}</code>
                              </td>
                              <td>
                                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                  {txn.transaction_type}
                                </span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: isDeposit ? 'var(--emerald-500)' : 'var(--rose-500)',
                                  }}
                                >
                                  {isDeposit ? '+' : '-'}{formatCurrency(txn.amount)}
                                </span>
                              </td>
                              <td>
                                <span style={{ textTransform: 'capitalize' }}>
                                  {txn.channel || 'online'}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="cm-badge"
                                  style={{
                                    background: txn.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                    color: txn.status === 'completed' ? 'var(--emerald-500)' : 'var(--amber-500)',
                                  }}
                                >
                                  {txn.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          branches={branches}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchCustomer()
            fetchSubResources()
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteCustomerModal
          customer={customer}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false)
            navigate('/customers')
          }}
        />
      )}
    </div>
  )
}
