import { Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UsersPage } from '@/pages/users';
import { ChallengesPage } from '@/pages/challenges';
import { SubmissionsPage } from '@/pages/submissions';
import { AvatarsPage } from '@/pages/avatars';

export const dashboardRoutes = [
  <Route
    key="dashboard"
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <Navigate to="/dashboard/users" />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="users"
    path="/dashboard/users"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <UsersPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="challenges"
    path="/dashboard/challenges"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <ChallengesPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="submissions"
    path="/dashboard/submissions"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SubmissionsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="avatars"
    path="/dashboard/avatars"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <AvatarsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];