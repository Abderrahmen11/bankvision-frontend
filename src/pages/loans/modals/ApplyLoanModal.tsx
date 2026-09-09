import React, { useState, useEffect } from 'react'
import { X, PlusCircle, Search, DollarSign } from 'lucide-react'
import { loansApi } from '@/api/loans'
import { customersApi } from '@/api/customers'
import { showToast } from '@/hooks/useToast'
import type { ApplyLoanPayload, LoanType } from '@/types/loan'
import type { Customer } from '@/types/customer'
import { calculateMonthlyPayment, formatCurrency } from '../loanHelpers'

interface Props {
  onClose: () => void
  onSuccess: () => void
  defaultCustomerId?: number
}

export const ApplyLoanModal: React.FC<Props> = ({ onClose, onSuccess, defaultCustomerId }) => {
  const [loading, setLoading] = useState(false)

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form fields
  const [loanType, setLoanType] = useState<LoanType>('personal')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('7.5')
  const [termMonths, setTermMonths] = useState('36')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  // Load default customer if provided
  useEffect(() => {
    if (defaultCustomerId) {
      customersApi
        .get(defaultCustomerId)
        .then((cust) => setSelectedCustomer(cust))
        .catch(() => {})
    }
  }, [defaultCustomerId])

  // Debounced search for customers
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await customersApi.list({ search: customerSearch.trim(), per_page: 8 })
        setCustomerResults(res.data || [])
      } catch {
        setCustomerResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [customerSearch])

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setCustomerSearch('')
    setCustomerResults([])
  }

  // Live estimated monthly payment
  const principalNum = parseFloat(principalAmount) || 0
  const rateNum = parseFloat(interestRate) || 0
  const termNum = parseInt(termMonths, 10) || 0
  const estMonthly = calculateMonthlyPayment(principalNum, rateNum, termNum)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer) {
      showToast.error('Please select an applicant customer.')
      return
    }

    if (principalNum <= 0) {
      showToast.error('Please enter a valid principal amount.')
      return
    }

    if (rateNum < 0) {
      showToast.error('Interest rate cannot be negative.')
      return
    }

    if (termNum <= 0) {
      showToast.error('Term must be at least 1 month.')
      return
    }

    const payload: ApplyLoanPayload = {
      customer_id: selectedCustomer.id,
      loan_type: loanType,
      principal_amount: principalNum,
      interest_rate: rateNum,
      term_months: termNum,
      start_date: startDate,
    }

    setLoading(true)
    try {
      await loansApi.apply(payload)
      showToast.success('Loan application submitted successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit loan application.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ln-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ln-modal">
        <div className="ln-modal-header">
          <h2>
            <PlusCircle size={17} /> New Loan Application
          </h2>
          <button className="ln-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ln-modal-body">
            {/* Customer Search / Selection */}
            <div className="ln-form-group">
              <label className="ln-form-label">Applicant Customer *</label>
              {selectedCustomer ? (
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
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedCustomer.full_name}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ({selectedCustomer.customer_number})
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedCustomer.email || selectedCustomer.phone || 'No contact specified'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerSearch('')
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="ln-search-wrap" style={{ width: '100%' }}>
                    <Search size={14} className="ln-search-icon" />
                    <input
                      type="text"
                      className="ln-search-input"
                      placeholder="Search customer by name or customer #..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Searching...
                    </div>
                  )}

                  {customerResults.length > 0 && (
                    <div className="ln-dropdown-results">
                      {customerResults.map((c) => (
                        <div
                          key={c.id}
                          className="ln-dropdown-item"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {c.full_name}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {c.customer_number}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.city || c.customer_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loan Type */}
            <div className="ln-form-group">
              <label className="ln-form-label">Loan Product Type *</label>
              <select
                className="ln-form-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
              >
                <option value="personal">Personal Loan</option>
                <option value="mortgage">Home Mortgage</option>
                <option value="auto">Auto Financing</option>
                <option value="business">Commercial / Business Loan</option>
              </select>
            </div>

            {/* Principal & Interest Rate */}
            <div className="ln-form-row">
              <div className="ln-form-group">
                <label className="ln-form-label">Principal Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="ln-form-input"
                  placeholder="e.g. 25000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  required
                />
              </div>

              <div className="ln-form-group">
                <label className="ln-form-label">Interest Rate (% APR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="ln-form-input"
                  placeholder="e.g. 7.50"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Term & Start Date */}
            <div className="ln-form-row">
              <div className="ln-form-group">
                <label className="ln-form-label">Term (Months) *</label>
                <select
                  className="ln-form-select"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                >
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="48">48 Months (4 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="120">120 Months (10 Years)</option>
                  <option value="180">180 Months (15 Years)</option>
                  <option value="360">360 Months (30 Years)</option>
                </select>
              </div>

              <div className="ln-form-group">
                <label className="ln-form-label">Disbursement Start Date *</label>
                <input
                  type="date"
                  className="ln-form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="ln-calc-box">
              <span>Estimated Monthly Installment:</span>
              <strong>{formatCurrency(estMonthly)}/mo</strong>
            </div>
          </div>

          <div className="ln-modal-footer">
            <button type="button" className="ln-btn ln-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="ln-btn ln-btn-primary" disabled={loading || !selectedCustomer}>
              {loading ? (
                <>Submitting...</>
              ) : (
                <>
                  <DollarSign size={15} /> Submit Loan Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
