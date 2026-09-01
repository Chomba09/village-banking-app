import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/')
      setNotifications(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all/')
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <div className="loading">Loading notifications...</div>

  return (
    <DashboardLayout title="Notifications">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="dashboard-title">Notifications</h1>
          <p className="dashboard-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="table-card">
        {notifications.length === 0 ? (
          <div className="empty-state">No notifications yet.</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              style={{ cursor: notif.is_read ? 'default' : 'pointer' }}
            >
              <div className={`notif-dot ${notif.is_read ? 'read' : ''}`} />
              <div>
                <div className="notif-message">{notif.message}</div>
                <div className="notif-date">
                  {new Date(notif.date).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default Notifications