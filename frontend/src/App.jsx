import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import TreasurerDashboard from './pages/TreasurerDashboard'
import CreateGroup from './pages/CreateGroup'
import TreasurerContributions from './pages/TreasurerContributions'
import TreasurerLoans from './pages/TreasurerLoans'
import MemberDashboard from './pages/MemberDashboard'
import MemberContributions from './pages/MemberContributions'
import MemberLoans from './pages/MemberLoans'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/main.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/treasurer/dashboard"
          element={
            <ProtectedRoute allowedRole="treasurer">
              <TreasurerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasurer/groups/create"
          element={
            <ProtectedRoute allowedRole="treasurer">
              <CreateGroup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasurer/groups/:groupId/contributions"
          element={
            <ProtectedRoute allowedRole="treasurer">
              <TreasurerContributions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasurer/groups/:groupId/loans"
          element={
            <ProtectedRoute allowedRole="treasurer">
              <TreasurerLoans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute allowedRole="member">
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/contributions/:groupId"
          element={
            <ProtectedRoute allowedRole="member">
              <MemberContributions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/loans/:groupId"
          element={
            <ProtectedRoute allowedRole="member">
              <MemberLoans />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App