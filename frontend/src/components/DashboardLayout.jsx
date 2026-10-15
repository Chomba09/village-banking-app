import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ProfileDrawer from './ProfileDrawer'

const MOBILE_BREAKPOINT = 768

function DashboardLayout({ children, title }) {
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true' ? true : false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed)
  }, [collapsed])

  // Close mobile sidebar when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        if (isMobile()) {
          setMobileOpen(false)
        } else if (!collapsed) {
          setCollapsed(true)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [collapsed])

  // On the topbar hamburger button:
  // - mobile: toggle the slide-in overlay sidebar
  // - desktop: collapse/expand as before
  const handleToggle = () => {
    if (isMobile()) {
      setMobileOpen(prev => !prev)
    } else {
      setCollapsed(prev => !prev)
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Dim backdrop — tapping it closes the sidebar on mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div ref={sidebarRef}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <TopBar
        collapsed={collapsed}
        onToggle={handleToggle}
        title={title}
        onProfileOpen={() => setProfileOpen(true)}
      />

      <main className={`dashboard-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  )
}

export default DashboardLayout
