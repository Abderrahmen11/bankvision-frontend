import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Server,
  CreditCard,
  Zap,
  FileSpreadsheet,
  ShieldAlert,
  Users,
  Code2,
  HelpCircle,
} from 'lucide-react'

interface DocsSidebarProps {
  activeSection: string
  onSectionClick: (section: string) => void
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  activeSection,
  onSectionClick,
}) => {
  return (
    <aside className="docs-sidebar">
      <div className="docs-sidebar-sticky">
        <div className="sidebar-group-title">PLATFORM GUIDE</div>
        <nav className="docs-toc-nav">
          <a
            href="#overview"
            className={`toc-link ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => onSectionClick('overview')}
          >
            <BookOpen size={16} />
            <span>1. Overview & Stack</span>
          </a>
          <a
            href="#ledger"
            className={`toc-link ${activeSection === 'ledger' ? 'active' : ''}`}
            onClick={() => onSectionClick('ledger')}
          >
            <Server size={16} />
            <span>2. Core Banking Ledger</span>
          </a>
          <a
            href="#accounts"
            className={`toc-link ${activeSection === 'accounts' ? 'active' : ''}`}
            onClick={() => onSectionClick('accounts')}
          >
            <CreditCard size={16} />
            <span>3. Accounts & Journals</span>
          </a>
          <a
            href="#transactions"
            className={`toc-link ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => onSectionClick('transactions')}
          >
            <Zap size={16} />
            <span>4. Transaction Clearing</span>
          </a>
          <a
            href="#loans"
            className={`toc-link ${activeSection === 'loans' ? 'active' : ''}`}
            onClick={() => onSectionClick('loans')}
          >
            <FileSpreadsheet size={16} />
            <span>5. Loan Origination</span>
          </a>
          <a
            href="#compliance"
            className={`toc-link ${activeSection === 'compliance' ? 'active' : ''}`}
            onClick={() => onSectionClick('compliance')}
          >
            <ShieldAlert size={16} />
            <span>6. AML & KYC Engine</span>
          </a>
          <a
            href="#rbac"
            className={`toc-link ${activeSection === 'rbac' ? 'active' : ''}`}
            onClick={() => onSectionClick('rbac')}
          >
            <Users size={16} />
            <span>7. Role Governance (RBAC)</span>
          </a>
          <a
            href="#api"
            className={`toc-link ${activeSection === 'api' ? 'active' : ''}`}
            onClick={() => onSectionClick('api')}
          >
            <Code2 size={16} />
            <span>8. API Specifications</span>
          </a>
          <a
            href="#faq"
            className={`toc-link ${activeSection === 'faq' ? 'active' : ''}`}
            onClick={() => onSectionClick('faq')}
          >
            <HelpCircle size={16} />
            <span>9. Frequently Asked Questions</span>
          </a>
        </nav>

        <div className="docs-sidebar-card">
          <div className="sidebar-card-badge">PRODUCTION SPEC</div>
          <p>BankVision v2.4 Enterprise Core Banking System.</p>
          <Link to="/login" className="sidebar-launch-link">
            Launch Live Demo &rarr;
          </Link>
        </div>
      </div>
    </aside>
  )
}
