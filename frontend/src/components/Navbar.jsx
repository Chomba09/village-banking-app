import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const role = localStorage.getItem('role')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🏦 Village Banking
      </div>
      <div className="navbar-user">
        <span className="navbar-username">
          {username} <span className="navbar-role">({role})</span>
        </span>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar