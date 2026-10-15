import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Bell,
  ClipboardList,
  LogOut,
  PiggyBank,
  HandCoins,
  FileText,
  CheckSquare,
  Users,
  Menu,
  X,
} from 'lucide-react'

function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = localStorage.getItem('role')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar whenever the user navigates to a new page
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const treasurerLinks = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/treasurer/dashboard' },
    { icon: <PiggyBank size={18} />, label: 'Make Contribution', path: '/treasurer/contribute' },
    { icon: <HandCoins size={18} />, label: 'Apply for Loan', path: '/treasurer/apply-loan' },
    { icon: <PlusCircle size={18} />, label: 'Create Group', path: '/treasurer/groups/create' },
    { icon: <Bell size={18} />, label: 'Notifications', path: '/treasurer/notifications' },
  ]

  const memberLinks = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/member/dashboard' },
    { icon: <PiggyBank size={18} />, label: 'Make Contribution', path: '/member/contribute' },
    { icon: <HandCoins size={18} />, label: 'Apply for Loan', path: '/member/apply-loan' },
    { icon: <FileText size={18} />, label: 'Notices', path: '/member/notices' },
    { icon: <ClipboardList size={18} />, label: 'Transactions', path: '/member/transactions' },
  ]

  const chairpersonLinks = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/chairperson/dashboard' },
    { icon: <CheckSquare size={18} />, label: 'Loan Approvals', path: '/chairperson/approvals' },
    { icon: <PiggyBank size={18} />, label: 'Make Contribution', path: '/chairperson/contribute' },
    { icon: <HandCoins size={18} />, label: 'Apply for Loan', path: '/chairperson/apply-loan' },
    { icon: <FileText size={18} />, label: 'Notices', path: '/chairperson/notices' },
    { icon: <ClipboardList size={18} />, label: 'Transactions', path: '/chairperson/transactions' },
    { icon: <Bell size={18} />, label: 'Notifications', path: '/chairperson/notifications' },
  ]

  const links =
    role === 'treasurer'
      ? treasurerLinks
      : role === 'chairperson'
      ? chairpersonLinks
      : memberLinks

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <>
      {/* Hamburger button — only visible on mobile (CSS controls display) */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Dim backdrop — tapping it closes the sidebar */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <span className="sidebar-brand-name">Village Banking</span>

          {/* Close button — only visible on mobile (CSS controls display) */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.label}
              className={`sidebar-nav-item ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
              title={collapsed ? link.label : ''}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-nav-item"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : ''}
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
