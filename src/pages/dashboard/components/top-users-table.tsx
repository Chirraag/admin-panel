import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TopUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  submissionCount: number;
}

export function TopUsersTable() {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setError(null);
        // First get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        // Then get all submissions
        const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
        
        // Create a map of user IDs to submission counts
        const submissionCounts = new Map<string, number>();
        submissionsSnapshot.docs.forEach(doc => {
          const userId = doc.data().user_id;
          if (userId) {
            submissionCounts.set(userId, (submissionCounts.get(userId) || 0) + 1);
          }
        });

        // Map users with their submission counts
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submissionCount: submissionCounts.get(doc.id) || 0
        }));

        // Sort by submission count and take top 10
        const sortedUsers = usersData
          .sort((a, b) => b.submissionCount - a.submissionCount)
          .slice(0, 10);

        setUsers(sortedUsers as TopUser[]);
      } catch (error) {
        console.error('Error fetching top users:', error);
        setError('Failed to load top users');
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-gray-500">Loading top users...</div>
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Top Users by Submissions</h3>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Submissions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">#{index + 1}</TableCell>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right font-medium">{user.submissionCount}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}