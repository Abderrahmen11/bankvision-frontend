import React, { useState, useEffect } from 'react'
import { X, PlusCircle, Search, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { transactionsApi } from '@/api/transactions'
import { accountsApi } from '@/api/accounts'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { RecordTransactionPayload, TransactionType, TransactionChannel } from '@/types/transaction'
import type { BankAccount } from '@/types/account'
import { formatCurrency } from '../transactionHelpers'

interface Props {
  onClose: () => void
  onSuccess: () => void
  defaultAccountId?: number
}

export const RecordTransactionModal: React.FC<Props> = ({ onClose, onSuccess, defaultAccountId }) => {
  const { user } = useAuth()
  const isCsr = user?.role === 'csr'
  const [loading, setLoading] = useState(false)

  // Account search
  const [accountSearch, setAccountSearch] = useState('')
  const [accountResults, setAccountResults] = useState<BankAccount[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  // Form fields
  const [txType, setTxType] = useState<TransactionType>('deposit')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [channel, setChannel] = useState<TransactionChannel>('branch')
  const [counterparty, setCounterparty] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'completed' | 'pending'>('completed')

  // Load default account if provided
  useEffect(() => {
    if (defaultAccountId) {
      accountsApi
        .get(defaultAccountId)
        .then((acc) => {
          setSelectedAccount(acc)
          if (acc.currency) setCurrency(acc.currency)
        })
        .catch(() => {})
    }
  }, [defaultAccountId])

  // Debounced search for accounts
  useEffect(() => {
    if (!accountSearch.trim()) {
      setAccountResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await accountsApi.list({ search: accountSearch.trim(), per_page: 8 })
        setAccountResults(res.data || [])
      } catch {
        setAccountResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [accountSearch])

  const handleSelectAccount = (acc: BankAccount) => {
    setSelectedAccount(acc)
    if (acc.currency) setCurrency(acc.currency)
    setAccountSearch('')
    setAccountResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAccount) {
      showToast.error('Please select an account.')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast.error('Please enter a valid positive amount.')
      return
    }

    if (isCsr && txType !== 'deposit' && txType !== 'withdrawal') {
      showToast.error('Customer Service Representatives may only record deposits or withdrawals.')
      return
    }

    const payload: RecordTransactionPayload = {
      account_id: selectedAccount.id,
      transaction_type: txType,
      amount: numAmount,
      currency,
      channel,
      status,
      counterparty: counterparty.trim() || undefined,
      description: description.trim() || undefined,
    }

    setLoading(true)
    try {
      await transactionsApi.record(payload)
      showToast.success('Transaction recorded successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record transaction.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tx-modal">
        <div className="tx-modal-header">
          <h2>
            <PlusCircle size={17} /> Record New Transaction
          </h2>
          <button className="tx-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tx-modal-body">
            {isCsr && (
              <div className="tx-compliance-banner" style={{ fontSize: '0.8rem', padding: '0.65rem 0.9rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>
                  <strong>CSR Notice:</strong> You are authorized to record deposits and withdrawals only.
                </span>
              </div>
            )}

            {/* Account Selector */}
            <div className="tx-form-group">
              <label className="tx-form-label">Select Account *</label>
              {selectedAccount ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--primary-500)',
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedAccount.account_number}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedAccount.customer?.full_name || `Customer #${selectedAccount.customer_id}`}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Bal: {formatCurrency(selectedAccount.balance, selectedAccount.currency)} ({selectedAccount.account_type})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccount(null)
                      setAccountSearch('')
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="tx-search-wrap" style={{ width: '100%' }}>
                    <Search size={14} className="tx-search-icon" />
                    <input
                      type="text"
                      className="tx-search-input"
                      placeholder="Search by account number or customer name..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Searching...
                    </div>
                  )}

                  {accountResults.length > 0 && (
                    <div className="tx-dropdown-results">
                      {accountResults.map((acc) => (
                        <div
                          key={acc.id}
                          className="tx-dropdown-item"
                          onClick={() => handleSelectAccount(acc)}
                        >
                          <div>
                            <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {acc.account_number}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {acc.customer?.full_name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                            {formatCurrency(acc.balance, acc.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type & Amount Row */}
            <div className="tx-form-row">
              <div className="tx-form-group">
                <label className="tx-form-label">Transaction Type *</label>
                <select
                  className="tx-form-select"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as TransactionType)}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  {!isCsr && <option value="transfer">Transfer</option>}
                  {!isCsr && <option value="wire">Wire</option>}
                </select>
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="tx-form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Currency & Channel Row */}
            <div className="tx-form-row">
              <div className="tx-form-group">
                <label className="tx-form-label">Currency</label>
                <select
                  className="tx-form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Channel</label>
                <select
                  className="tx-form-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as TransactionChannel)}
                >
                  <option value="branch">Branch</option>
                  <option value="online">Online</option>
                  <option value="atm">ATM</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>

            {/* Counterparty */}
            <div className="tx-form-group">
              <label className="tx-form-label">Counterparty (Optional)</label>
              <input
                type="text"
                className="tx-form-input"
                placeholder="Sender / Recipient / Institution name"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="tx-form-group">
              <label className="tx-form-label">Description / Memo</label>
              <textarea
                className="tx-form-textarea"
                rows={2}
                placeholder="Reason or notes for this transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Status (Admin / Manager only) */}
            {!isCsr && (
              <div className="tx-form-group">
                <label className="tx-form-label">Initial Status</label>
                <select
                  className="tx-form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'completed' | 'pending')}
                >
                  <option value="completed">Completed (Immediate settlement)</option>
                  <option value="pending">Pending (Requires review/approval)</option>
                </select>
              </div>
            )}
          </div>

          <div className="tx-modal-footer">
            <button type="button" className="tx-btn tx-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="tx-btn tx-btn-primary" disabled={loading || !selectedAccount}>
              {loading ? (
                <>Recording...</>
              ) : txType === 'deposit' ? (
                <>
                  <ArrowDownLeft size={15} /> Record Deposit
                </>
              ) : (
                <>
                  <ArrowUpRight size={15} /> Record Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
