import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token')
  const role = localStorage.getItem('role')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    if (role === 'treasurer') return <Navigate to="/treasurer/dashboard" replace />
    if (role === 'chairperson') return <Navigate to="/chairperson/dashboard" replace />
    return <Navigate to="/member/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
