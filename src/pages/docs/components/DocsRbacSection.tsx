import React from 'react'

export const DocsRbacSection: React.FC = () => {
  return (
    <section id="rbac" className="docs-section">
      <span className="section-chapter">CHAPTER 07</span>
      <h2 className="docs-section-title">Role-Based Access Control (RBAC)</h2>
      <p>
        BankVision strictly separates operational duties into 6 institutional roles to ensure compliance with banking security standards:
      </p>

      <div className="rbac-roles-grid">
        <div className="rbac-card">
          <div className="rbac-header admin">SYSTEM ADMINISTRATOR</div>
          <p>Full institution-wide control, user provisioning, system parameters, and branch governance.</p>
        </div>
        <div className="rbac-card">
          <div className="rbac-header manager">BRANCH MANAGER</div>
          <p>Branch oversight, high-value loan approvals, customer accounts, and teller drawer balancing.</p>
        </div>
        <div className="rbac-card">
          <div className="rbac-header compliance">COMPLIANCE OFFICER</div>
          <p>AML screening, KYC queue review, transaction flagging, and SAR regulatory filings.</p>
        </div>
        <div className="rbac-card">
          <div className="rbac-header csr">CUSTOMER SERVICE REP</div>
          <p>Customer onboarding, retail account opening, counter deposits, and card issuance.</p>
        </div>
        <div className="rbac-card">
          <div className="rbac-header analyst">FINANCIAL ANALYST</div>
          <p>Bank-wide portfolio trends, liquidity stress testing, and executive reporting.</p>
        </div>
        <div className="rbac-card">
          <div className="rbac-header auditor">INTERNAL AUDITOR</div>
          <p>Unrestricted read-only investigation, forensic ledger trails, and compliance verification.</p>
        </div>
      </div>
    </section>
  )
}
