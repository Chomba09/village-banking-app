import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ProfileDrawer from './ProfileDrawer'

function DashboardLayout({ children, title }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true' ? true : false
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed)
  }, [collapsed])

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

  const handleToggle = () => {
    setCollapsed(prev => !prev)
  }

  return (
    <div className="dashboard-layout">
      <div ref={sidebarRef}>
        <Sidebar collapsed={collapsed} />
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