import React from 'react'
import { Terminal } from 'lucide-react'

export const DocsTransactionsSection: React.FC = () => {
  return (
    <section id="transactions" className="docs-section">
      <span className="section-chapter">CHAPTER 04</span>
      <h2 className="docs-section-title">Transaction Processing & Clearing</h2>
      <p>
        The transaction lifecycle handles deposits, withdrawals, internal transfers, and external wire clearances with immediate validation and audit logging.
      </p>

      <div className="code-block-container">
        <div className="code-block-header">
          <Terminal size={14} />
          <span>POST /api/transactions - Sample Request</span>
        </div>
        <pre className="code-pre">
{`{
  "account_id": 148,
  "transaction_type": "transfer",
  "amount": 2500.00,
  "currency": "USD",
  "recipient_account_number": "ACC-2026-94821",
  "description": "Monthly commercial lease settlement",
  "idempotency_key": "idemp_bv_8849204812"
}`}
        </pre>
      </div>
    </section>
  )
}
