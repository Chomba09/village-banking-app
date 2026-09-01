import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Bell, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

function TopBar({ collapsed, onToggle, title, onProfileOpen }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'U'
  const role = localStorage.getItem('role')
  const [unreadCount, setUnreadCount] = useState(0)

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
    : '/member/notifications'

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