import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  newUsers7Days: number;
  totalSubmissions: number;
  newSubmissions7Days: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsers7Days: 0,
    totalSubmissions: 0,
    newSubmissions7Days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sevenDaysAgo = Timestamp.fromDate(subDays(new Date(), 7));

        // Get total users count
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        const totalUsers = usersSnapshot.data().count;

        // Get new users count
        const recentUsersQuery = query(
          collection(db, 'users'),
          where('createdTime', '>=', sevenDaysAgo)
        );
        const recentUsersSnapshot = await getCountFromServer(recentUsersQuery);
        const newUsers7Days = recentUsersSnapshot.data().count;

        // Get total submissions count
        const submissionsSnapshot = await getCountFromServer(collection(db, 'submissions'));
        const totalSubmissions = submissionsSnapshot.data().count;

        // Get new submissions count
        const recentSubmissionsQuery = query(
          collection(db, 'submissions'),
          where('createdAt', '>=', sevenDaysAgo)
        );
        const recentSubmissionsSnapshot = await getCountFromServer(recentSubmissionsQuery);
        const newSubmissions7Days = recentSubmissionsSnapshot.data().count;

        setStats({
          totalUsers,
          newUsers7Days,
          totalSubmissions,
          newSubmissions7Days,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}