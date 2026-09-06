import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  Sun,
  Moon,
  ArrowRight,
  Menu,
  X,
  CreditCard,
  Users,
  BookOpen,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)

  const lastScrollY = useRef(0)

  // Smart Headroom Navbar scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 20)

      if (currentScrollY > 120 && currentScrollY > lastScrollY.current) {
        // Scrolling down past threshold -> hide
        setIsNavVisible(false)
      } else {
        // Scrolling up or at top -> show
        setIsNavVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Fixed / Smart Header Navigation */}
      <header
        className={`landing-header ${isScrolled ? 'scrolled' : ''} ${
          !isNavVisible ? 'nav-hidden' : 'nav-visible'
        }`}
      >
        <div className="landing-header-container">
          <Link
            to="/"
            className="landing-brand"
            title="BankVision Core Banking"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="landing-brand-icon">
              <Landmark size={24} />
            </div>
            <div className="landing-brand-text">
              <span className="brand-title">BankVision</span>
              <span className="brand-subtitle">Core Banking</span>
            </div>
          </Link>

          <nav className="landing-nav-links desktop-only" aria-label="Landing page navigation">
            <a href="#features" className="nav-anchor-link">
              Capabilities
            </a>
            <a href="#demo-roles" className="nav-anchor-link">
              Demo Personas
            </a>
            <Link to="/docs" className="nav-anchor-link">
              Documentation & FAQ
            </Link>
            <a href="#security" className="nav-anchor-link">
              Security
            </a>
          </nav>

          <div className="landing-header-actions">
            <button
              type="button"
              className="theme-switcher-pill"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard" className="cta-button primary-pill desktop-only">
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/login" className="cta-button primary-pill desktop-only">
                <span>Access Terminal</span>
                <ArrowRight size={16} />
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-nav-toggle mobile-only"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link
            to="/"
            className="landing-brand"
            onClick={() => {
              setIsMobileMenuOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <div className="landing-brand-icon">
              <Landmark size={20} />
            </div>
            <div className="landing-brand-text">
              <span className="brand-title">BankVision</span>
              <span className="brand-subtitle">Core Banking</span>
            </div>
          </Link>

          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-nav">
          <a
            href="#features"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <CreditCard size={18} />
            <span>Capabilities</span>
          </a>
          <a
            href="#demo-roles"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Users size={18} />
            <span>Demo Personas</span>
          </a>
          <Link
            to="/docs"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BookOpen size={18} />
            <span>Documentation & FAQ</span>
          </Link>
          <a
            href="#security"
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ShieldCheck size={18} />
            <span>Security</span>
          </a>
        </nav>

        <div className="mobile-drawer-footer">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="cta-button primary-pill mobile-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="cta-button primary-pill mobile-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Access Terminal</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
