import { showToast } from '@/shared/hooks'
import React, { useState, useEffect } from 'react'
import { X, PlusCircle, Search } from 'lucide-react'
import { accountsApi } from '@/features/accounts/api/accounts'
import { customersApi } from '@/features/customers/api/customers'
import type { OpenAccountPayload } from '@/features/accounts/types'
import type { Customer } from '@/features/customers/types'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export const OpenAccountModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers]           = useState<Customer[]>([])
  const [searchLoading, setSearchLoading]   = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form fields
  const [accountType, setAccountType] = useState<'savings' | 'checking' | 'business'>('savings')
  const CURRENCY = 'TND' // Fixed: Tunisian Dinar
  const [openingBalance, setOpeningBalance] = useState('')
  const [interestRate, setInterestRate]     = useState('')
  const [openedDate, setOpenedDate]         = useState(new Date().toISOString().split('T')[0])

  // Debounce customer search
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await customersApi.list({ search: customerSearch.trim(), per_page: 8 })
        setCustomers(res.data || [])
      } catch {
        setCustomers([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [customerSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) {
      showToast.error('Please select a customer.')
      return
    }

    const payload: OpenAccountPayload = {
      customer_id:     selectedCustomer.id,
      account_type:    accountType,
      currency: CURRENCY,
      opening_balance: openingBalance ? parseFloat(openingBalance) : undefined,
      interest_rate:   interestRate   ? parseFloat(interestRate)   : undefined,
      opened_date:     openedDate     || undefined,
    }

    setLoading(true)
    try {
      await accountsApi.open(payload)
      showToast.success('Account opened successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open account.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="am-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal">
        <div className="am-modal-header">
          <h2><PlusCircle size={16} /> Open New Account</h2>
          <button className="am-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="am-modal-body">
            {/* Customer Search */}
            <div className="am-form-group">
              <label className="am-form-label">Customer *</label>
              {selectedCustomer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--primary-500)', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {selectedCustomer.full_name}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.78rem' }}>
                      {selectedCustomer.customer_number}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="am-form-input"
                    style={{ paddingLeft: '2rem' }}
                    type="text"
                    placeholder="Search customer by name or number…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {(customers.length > 0 || searchLoading) && (
                    <div style={{
                      position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 9999,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxHeight: 220, overflowY: 'auto',
                    }}>
                      {searchLoading && (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Searching…</div>
                      )}
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]) }}
                          style={{
                            padding: '0.65rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
                            color: 'var(--text-primary)', transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          <strong>{c.full_name}</strong>
                          <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.customer_number} · {c.email}
                          </span>
                        </div>
                      ))}
                      {!searchLoading && customers.length === 0 && customerSearch.trim() && (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>No customers found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="am-form-row">
              {/* Account Type */}
              <div className="am-form-group">
                <label className="am-form-label">Account Type *</label>
                <select
                  className="am-form-select"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as typeof accountType)}
                  required
                >
                  <option value="savings">Savings</option>
                  <option value="checking">Checking</option>
                  <option value="business">Business</option>
                </select>
              </div>

              {/* Currency — fixed TND (Tunisian Dinar) */}
            </div>

            <div className="am-form-row">
              {/* Opening Balance */}
              <div className="am-form-group">
                <label className="am-form-label">Opening Balance</label>
                <input
                  className="am-form-input"
                  type="number"
                    inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
                <span className="am-form-hint">Optional initial deposit</span>
              </div>

              {/* Interest Rate */}
              <div className="am-form-group">
                <label className="am-form-label">Interest Rate (%)</label>
                <input
                  className="am-form-input"
                  type="number"
                    inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <span className="am-form-hint">Annual percentage rate</span>
              </div>
            </div>

            {/* Opened Date */}
            <div className="am-form-group">
              <label className="am-form-label">Opened Date</label>
              <input
                className="am-form-input"
                type="date"
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="am-modal-footer">
            <button type="button" className="am-btn am-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="am-btn am-btn-primary" disabled={loading}>
              {loading ? 'Opening…' : 'Open Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
