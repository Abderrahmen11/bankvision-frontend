import React from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  Search,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

interface DocsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="docs-header">
      <div className="docs-header-container">
        <div className="docs-header-left">
          <Link to="/" className="docs-brand" title="BankVision Home">
            <div className="docs-brand-icon">
              <Landmark size={22} />
            </div>
            <div className="docs-brand-text">
              <span className="brand-name">BankVision</span>
              <span className="brand-badge">Documentation</span>
            </div>
          </Link>

          <Link to="/" className="docs-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="docs-header-center">
          <div className="docs-search-bar">
            <Search size={16} className="docs-search-icon" />
            <input
              type="text"
              placeholder="Search documentation and FAQ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="docs-header-right">
          <button
            type="button"
            className="docs-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="docs-cta-btn">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/login" className="docs-cta-btn">
              <span>Access Terminal</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
