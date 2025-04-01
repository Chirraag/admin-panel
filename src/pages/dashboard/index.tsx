import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatsCard } from './components/stats-card';
import { TopUsersTable } from './components/top-users-table';
import { Users, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="All registered users"
        />
        <StatsCard
          title="New Users"
          value={stats.newUsers7Days}
          icon={Users}
          description="Last 7 days"
          trend={stats.newUsers7Days > 0 ? 'up' : undefined}
        />
        <StatsCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={Trophy}
          description="All challenge submissions"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <TopUsersTable />
      </div>
    </div>
  );
}