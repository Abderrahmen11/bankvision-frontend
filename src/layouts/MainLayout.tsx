import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import './MainLayout.css'

interface MainLayoutProps {
  children?: React.ReactNode
}

const SIDEBAR_COLLAPSED_KEY = 'bankvision_sidebar_collapsed'

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [isMobileOpen, setIsMobileOpen] = useState(false)

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

  return (
    <div className="bankvision-app-layout">
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
          <div className="layout-content-container animate-fade-in">
            {children || <Outlet />}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
