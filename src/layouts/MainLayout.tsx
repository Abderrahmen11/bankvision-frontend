import { useAuth, useResponsiveTableLabels } from '@/shared/hooks'
import React, { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { BranchUnassignedPage } from '@/features/auth'
import './MainLayout.css'

interface MainLayoutProps {
  children?: React.ReactNode
}

const SIDEBAR_COLLAPSED_KEY = 'bankvision_sidebar_collapsed'

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth()

  // Manager/CSR accounts without a branch assignment are rejected by the
  // backend's BranchScope on nearly every endpoint — block the shell instead
  // of surfacing serial 403s.
  const isBranchUnassigned =
    (user?.role === 'manager' || user?.role === 'csr') && !user?.branch
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Label table cells so the mobile stylesheet can render rows as cards
  useResponsiveTableLabels(contentRef)


  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch (err) {
        console.warn('Failed to save sidebar state to localStorage:', err)
      }
      return next
    })
  }

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isBranchUnassigned) {
    return (
      <>
        <Toaster position="top-right" />
        <BranchUnassignedPage />
      </>
    )
  }

  return (
    <div className="bankvision-app-layout">
      <Toaster position="top-right" />
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container: Navbar + Content + Footer */}
      <div className={`layout-main-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        <main className="layout-content-area" id="main-content" tabIndex={-1}>
          <div ref={contentRef} className="layout-content-container animate-fade-in">
            {children || <Outlet />}
          </div>
        </main>

        <Footer />
      </div>

      {/* Thumb-friendly bottom navigation (mobile only) */}
      <BottomNav onOpenMobileSidebar={() => setIsMobileOpen(true)} />
    </div>
  )
}
