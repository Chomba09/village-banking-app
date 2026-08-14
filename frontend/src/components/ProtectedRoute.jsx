import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token')
  const role = localStorage.getItem('role')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    if (role === 'treasurer') {
      return <Navigate to="/treasurer/dashboard" replace />
    } else {
      return <Navigate to="/member/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute