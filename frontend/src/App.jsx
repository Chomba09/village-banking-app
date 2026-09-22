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
import Notifications from './pages/Notifications'
import TransactionHistory from './pages/TransactionHistory'
import ProtectedRoute from './components/ProtectedRoute'
import JoinGroup from './pages/JoinGroup'
import MemberMakeContribution from './pages/MemberMakeContribution'
import MemberApplyLoan from './pages/MemberApplyLoan'
import TreasurerGroupDetail from './pages/TreasurerGroupDetail'
import TreasurerGroupMembers from './pages/TreasurerGroupMembers'
import TreasurerNotices from './pages/TreasurerNotices'
import MemberNotices from './pages/MemberNotices'
import NewCycle from './pages/NewCycle'
import MemberGroupDetail from './pages/MemberGroupDetail'
import TermsAndPrivacy from './pages/TermsAndPrivacy'
import TreasurerMakeContribution from './pages/TreasurerMakeContribution'
import TreasurerApplyLoan from './pages/TreasurerApplyLoan'
import GroupActivity from './pages/GroupActivity'
import CycleReport from './pages/CycleReport'
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
        <Route path="/treasurer/groups/:groupId" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerGroupDetail /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/members" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerGroupMembers /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/new-cycle" element={
          <ProtectedRoute allowedRole="treasurer"><NewCycle /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/activity" element={
          <ProtectedRoute allowedRole="treasurer">
            <GroupActivity />
          </ProtectedRoute>
        } />
        <Route path="/member/groups/:groupId/activity" element={
          <ProtectedRoute allowedRole="member">
            <GroupActivity />
          </ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/cycle-report" element={
          <ProtectedRoute allowedRole="treasurer">
            <CycleReport />
          </ProtectedRoute>
        } />
        <Route path="/member/groups/:groupId/cycle-report" element={
          <ProtectedRoute allowedRole="member">
            <CycleReport />
          </ProtectedRoute>
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
        <Route path="/treasurer/notifications" element={
          <ProtectedRoute allowedRole="treasurer"><Notifications /></ProtectedRoute>
        } />
        <Route path="/treasurer/transactions" element={
          <ProtectedRoute allowedRole="treasurer"><TransactionHistory /></ProtectedRoute>
        } />
        <Route path="/treasurer/groups/:groupId/notices" element={
          <ProtectedRoute allowedRole="treasurer"><TreasurerNotices /></ProtectedRoute>
        } />
        <Route path="/treasurer/contribute" element={
          <ProtectedRoute allowedRole="treasurer">
            <TreasurerMakeContribution />
          </ProtectedRoute>
        } />
        <Route path="/treasurer/apply-loan" element={
          <ProtectedRoute allowedRole="treasurer">
            <TreasurerApplyLoan />
          </ProtectedRoute>
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
        <Route path="/member/notifications" element={
          <ProtectedRoute allowedRole="member"><Notifications /></ProtectedRoute>
        } />
        <Route path="/member/transactions" element={
          <ProtectedRoute allowedRole="member"><TransactionHistory /></ProtectedRoute>
        } />
        <Route path="/member/notices" element={
          <ProtectedRoute allowedRole="member"><MemberNotices /></ProtectedRoute>
        } />
        <Route path="/member/groups/:groupId" element={
          <ProtectedRoute allowedRole="member"><MemberGroupDetail /></ProtectedRoute>
        } />
        <Route path="/terms" element={<TermsAndPrivacy />} />
        <Route path="/terms" element={<TermsAndPrivacy />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App