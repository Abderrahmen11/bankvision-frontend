import React from 'react'
import { ShieldCheck } from 'lucide-react'

export const DocsLedgerSection: React.FC = () => {
  return (
    <section id="ledger" className="docs-section">
      <span className="section-chapter">CHAPTER 02</span>
      <h2 className="docs-section-title">Core Banking Engine & Real-Time Ledger</h2>
      <p>
        The ledger forms the foundational source of truth for all balances across the institution. It enforces double-entry rules where every credit must be balanced with a corresponding debit entry.
      </p>
      <div className="docs-callout note">
        <ShieldCheck size={18} className="callout-icon" />
        <div>
          <strong>Atomic Execution:</strong> All balance updates occur within dedicated database transactions with `FOR UPDATE` row locks to prevent race conditions during concurrent settlements.
        </div>
      </div>

      <h3 className="docs-subsection-title">Key Ledger Properties</h3>
      <ul className="docs-list">
        <li><strong>Sub-25ms Execution:</strong> In-memory indexes and cached account routes provide lightning-fast transaction responses.</li>
        <li><strong>Zero Float Loss:</strong> Guaranteed balance accuracy with high-precision decimal accounting (numeric scale 2).</li>
        <li><strong>Idempotent Settlements:</strong> Every clearing request requires a unique idempotency key to prevent double charging.</li>
      </ul>
    </section>
  )
}
