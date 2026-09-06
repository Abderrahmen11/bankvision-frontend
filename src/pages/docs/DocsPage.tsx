import React, { useState, useEffect } from 'react'
import { DocsHeader } from './components/DocsHeader'
import { DocsSidebar } from './components/DocsSidebar'
import { DocsOverviewSection } from './components/DocsOverviewSection'
import { DocsLedgerSection } from './components/DocsLedgerSection'
import { DocsAccountsSection } from './components/DocsAccountsSection'
import { DocsTransactionsSection } from './components/DocsTransactionsSection'
import { DocsLoansSection } from './components/DocsLoansSection'
import { DocsComplianceSection } from './components/DocsComplianceSection'
import { DocsRbacSection } from './components/DocsRbacSection'
import { DocsApiSection } from './components/DocsApiSection'
import { DocsFaqSection } from './components/DocsFaqSection'
import { DocsFooter } from './components/DocsFooter'
import './DocsPage.css'

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Scroll spy to update active section in sidebar
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'overview',
        'ledger',
        'accounts',
        'transactions',
        'loans',
        'compliance',
        'rbac',
        'api',
        'faq',
      ]
      const scrollPosition = window.scrollY + 140

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="docs-page-root">
      {/* 1. Docs Header */}
      <DocsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Main Docs Content Layout */}
      <div className="docs-main-container">
        {/* Left Table of Contents Sidebar */}
        <DocsSidebar
          activeSection={activeSection}
          onSectionClick={setActiveSection}
        />

        {/* Right Documentation Articles */}
        <main className="docs-content-area">
          <DocsOverviewSection />
          <hr className="docs-divider" />

          <DocsLedgerSection />
          <hr className="docs-divider" />

          <DocsAccountsSection />
          <hr className="docs-divider" />

          <DocsTransactionsSection />
          <hr className="docs-divider" />

          <DocsLoansSection />
          <hr className="docs-divider" />

          <DocsComplianceSection />
          <hr className="docs-divider" />

          <DocsRbacSection />
          <hr className="docs-divider" />

          <DocsApiSection />
          <hr className="docs-divider" />

          <DocsFaqSection searchQuery={searchQuery} />
        </main>
      </div>

      {/* 3. Docs Footer */}
      <DocsFooter />
    </div>
  )
}
