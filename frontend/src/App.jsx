import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import TreasurerDashboard from './pages/TreasurerDashboard'
import CreateGroup from './pages/CreateGroup'
import TreasurerContributions from './pages/TreasurerContributions'
import TreasurerLoans from './pages/TreasurerLoans'
import TreasurerWithdrawals from './pages/TreasurerWithdrawals'
import MemberDashboard from './pages/MemberDashboard'
import MemberContributions from './pages/MemberContributions'
import MemberLoans from './pages/MemberLoans'
import MemberDeposit from './pages/MemberDeposit'
import Notifications from './pages/Notifications'
import TransactionHistory from './pages/TransactionHistory'
import ProtectedRoute from './components/ProtectedRoute'
import JoinGroup from './pages/JoinGroup'
import MemberMakeContribution from './pages/MemberMakeContribution'
import MemberApplyLoan from './pages/MemberApplyLoan'
import './styles/main.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join/:token" element={<JoinGroup />} />
        <Route path="/member/contribute" element={
          <ProtectedRoute allowedRole="member"><MemberMakeContribution /></ProtectedRoute>
        } />
        <Route path="/member/apply-loan" element={
          <ProtectedRoute allowedRole="member"><MemberApplyLoan /></ProtectedRoute>
        } />

        {/* Treasurer routes */}
        <Route path="/treasurer/dashboard" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerDashboard /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/create" element={
          <ProtectedRoute allowedRole="treasurer"><CreateGroup /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/contributions" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerContributions /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/loans" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerLoans /></ProtectedRoute>
        } />
        <Route path="/treasurer/withdrawals" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerWithdrawals /></ProtectedRoute>
        } />
        <Route path="/treasurer/notifications" element={
          <ProtectedRoute allowedRole="treasurer"><Notifications /></ProtectedRoute>
        } />
        <Route path="/treasurer/transactions" element={
          <ProtectedRoute allowedRole="treasurer"><TransactionHistory /></ProtectedRoute>
        } />

        {/* Member routes */}
        <Route path="/member/dashboard" element={
          <ProtectedRoute allowedRole="member"><MemberDashboard /></ProtectedRoute>
        } />
        <Route path="/member/contributions/:groupId" element={
          <ProtectedRoute allowedRole="member"><MemberContributions /></ProtectedRoute>
        } />
        <Route path="/member/loans/:groupId" element={
          <ProtectedRoute allowedRole="member"><MemberLoans /></ProtectedRoute>
        } />
        <Route path="/member/deposit" element={
          <ProtectedRoute allowedRole="member"><MemberDeposit /></ProtectedRoute>
        } />
        <Route path="/member/notifications" element={
          <ProtectedRoute allowedRole="member"><Notifications /></ProtectedRoute>
        } />
        <Route path="/member/transactions" element={
          <ProtectedRoute allowedRole="member"><TransactionHistory /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App