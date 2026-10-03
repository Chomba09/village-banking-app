import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Bell, Menu, X, Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

function TopBar({ collapsed, onToggle, title, onProfileOpen }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'U'
  const role = localStorage.getItem('role')
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await api.get('/notifications/unread-count/')
        setUnreadCount(response.data.unread_count)
      } catch (err) {
        // fail silently
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const notifPath = role === 'treasurer'
    ? '/treasurer/notifications'
    : role === 'chairperson'
      ? '/chairperson/notifications'
      : '/member/notifications'

  const searchPath = role === 'treasurer'
    ? '/treasurer/search'
    : role === 'chairperson'
      ? '/chairperson/search'
      : '/member/search'

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${searchPath}?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="topbar" style={{
      left: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    }}>
      <div className="topbar-left">
        <button className="btn-icon" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
        <span className="topbar-title">{title}</span>
      </div>

      <form className="topbar-search" onSubmit={handleSearchSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        maxWidth: '360px',
        margin: '0 16px',
        gap: '6px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px'
      }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members, loans, transactions..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '13px',
            color: 'var(--text-primary)'
          }}
        />
      </form>

      <div className="topbar-right">
        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="topbar-icon-btn"
          onClick={() => navigate(notifPath)}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div
          className="topbar-avatar"
          onClick={onProfileOpen}
          title="Profile"
        >
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

export default TopBar