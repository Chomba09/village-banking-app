import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ProfileDrawer from './ProfileDrawer'

function DashboardLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !collapsed
      ) {
        setCollapsed(true)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [collapsed])

  return (
    <div className="dashboard-layout">
      <div ref={sidebarRef}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      <TopBar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
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