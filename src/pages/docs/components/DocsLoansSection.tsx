import React from 'react'
import { CheckCircle2 } from 'lucide-react'

export const DocsLoansSection: React.FC = () => {
  return (
    <section id="loans" className="docs-section">
      <span className="section-chapter">CHAPTER 05</span>
      <h2 className="docs-section-title">Loan Origination & Amortization Engine</h2>
      <p>
        Loans progress through an institutional approval lifecycle: <code>pending</code> &rarr; <code>under_review</code> &rarr; <code>approved</code> &rarr; <code>disbursed</code> &rarr; <code>completed</code> (or <code>defaulted</code>).
      </p>
      <div className="docs-features-checklist">
        <div className="check-item"><CheckCircle2 size={16} /> Automated credit score evaluation</div>
        <div className="check-item"><CheckCircle2 size={16} /> Dynamic reducing-balance amortization schedules</div>
        <div className="check-item"><CheckCircle2 size={16} /> Collateral valuation tracking & LTV calculation</div>
        <div className="check-item"><CheckCircle2 size={16} /> Auto-disbursement to designated borrower checking accounts</div>
      </div>
    </section>
  )
}
