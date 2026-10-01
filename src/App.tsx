import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardRouter } from './pages/DashboardRouter';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SchoolWeeksPage } from './pages/admin/SchoolWeeksPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';

// School Pages (BGH, TPT, Giám thị)
import { SchoolDashboard } from './pages/school/SchoolDashboard';
import { SchoolViolationsPage } from './pages/school/SchoolViolationsPage';

// GVCN Pages
import { GvcnDashboard } from './pages/gvcn/GvcnDashboard';
import { CompetitionScoringPage } from './pages/gvcn/CompetitionScoringPage';
import { ClassStudentsPage } from './pages/gvcn/ClassStudentsPage';
import { ClassGroupsPage } from './pages/gvcn/ClassGroupsPage';
import { ClassRankingPage } from './pages/gvcn/ClassRankingPage';
import { ApprovalsPage } from './pages/gvcn/ApprovalsPage';
import { WeeklySummaryPage } from './pages/gvcn/WeeklySummaryPage';
import { MonthlySummaryPage } from './pages/gvcn/MonthlySummaryPage';
import { ClassCriteriaPage } from './pages/gvcn/ClassCriteriaPage';
import { PublicSharePage } from './pages/gvcn/PublicSharePage';

// Group Leader Pages
import { GroupLeaderDashboard } from './pages/totruong/GroupLeaderDashboard';
import { GroupScoringPage } from './pages/totruong/GroupScoringPage';
import { GroupMembersPage } from './pages/totruong/GroupMembersPage';

// Public Parent Portal
import { PublicClassView } from './pages/public/PublicClassView';

export function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Root & Public routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/public" element={<PublicClassView />} />
            <Route path="/public/:shareToken" element={<PublicClassView />} />

            {/* Smart Dashboard Router */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Authenticated Workspace */}
            <Route element={<Layout />}>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/weeks" element={<SchoolWeeksPage />} />
              <Route path="/admin/school-weeks" element={<SchoolWeeksPage />} />
              <Route path="/admin/classes" element={<SchoolDashboard />} />
              <Route path="/admin/students" element={<ClassStudentsPage />} />
              <Route path="/admin/criteria" element={<ClassCriteriaPage />} />
              <Route path="/admin/audit" element={<AuditLogPage />} />
              <Route path="/admin/settings" element={<SystemSettingsPage />} />

              {/* School Leadership & Proctor */}
              <Route path="/school" element={<SchoolDashboard />} />
              <Route path="/school/ranking" element={<ClassRankingPage />} />
              <Route path="/school/classes" element={<ClassStudentsPage />} />
              <Route path="/school/violations" element={<SchoolViolationsPage />} />
              <Route path="/school/summaries" element={<WeeklySummaryPage />} />
              <Route path="/school/reports" element={<ClassRankingPage />} />

              {/* GVCN Routes */}
              <Route path="/gvcn" element={<GvcnDashboard />} />
              <Route path="/gvcn/competition" element={<CompetitionScoringPage />} />
              <Route path="/gvcn/students" element={<ClassStudentsPage />} />
              <Route path="/gvcn/groups" element={<ClassGroupsPage />} />
              <Route path="/gvcn/ranking" element={<ClassRankingPage />} />
              <Route path="/gvcn/approvals" element={<ApprovalsPage />} />
              <Route path="/gvcn/weekly" element={<WeeklySummaryPage />} />
              <Route path="/gvcn/monthly" element={<MonthlySummaryPage />} />
              <Route path="/gvcn/criteria" element={<ClassCriteriaPage />} />
              <Route path="/gvcn/share" element={<PublicSharePage />} />

              {/* Group Leader Routes */}
              <Route path="/to-truong" element={<GroupLeaderDashboard />} />
              <Route path="/to-truong/score" element={<GroupScoringPage />} />
              <Route path="/to-truong/members" element={<GroupMembersPage />} />
              <Route path="/to-truong/history" element={<SchoolViolationsPage />} />
            </Route>

            {/* Default fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
