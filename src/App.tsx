import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthForm } from '@/components/auth/auth-form';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/pages/dashboard';
import { UsersPage } from '@/pages/users';
import { TeamsPage } from '@/pages/teams';
import { TeamDetailsPage } from '@/pages/teams/team-details';
import { ChallengesPage } from '@/pages/challenges';
import { SubmissionsPage } from '@/pages/submissions';
import { AvatarsPage } from '@/pages/avatars';
import { CategoriesPage } from '@/pages/categories';
import { CoursesPage } from '@/pages/courses';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/protected-route';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/teams"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeamsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/teams/:teamId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeamDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/challenges"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ChallengesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/submissions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubmissionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/avatars"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AvatarsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/categories"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CategoriesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/courses"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoursesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;