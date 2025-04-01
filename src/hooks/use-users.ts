import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/user';

const USERS_PER_PAGE = 25; // Increased initial load

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = async (refresh?: boolean) => {
    try {
      if (refresh) {
        setUsers([]);
        setLastDoc(null);
      }

      let q = query(
        collection(db, 'users'),
        orderBy('createdTime', 'desc'),
        limit(USERS_PER_PAGE)
      );

      if (!refresh && lastDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdTime', 'desc'),
          startAfter(lastDoc),
          limit(USERS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdTime: doc.data().createdTime?.toDate(),
        user_credits: doc.data().user_credits || 0,
        is_credits_locked: doc.data().is_credits_locked || false,
      } as User));

      if (refresh) {
        setUsers(usersData);
      } else {
        setUsers(prev => [...prev, ...usersData]);
      }

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === USERS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loadMore = async (refresh?: boolean) => {
    if ((!lastDoc || !hasMore || loadingMore) && !refresh) return;
    setLoadingMore(true);
    await fetchUsers(refresh);
  };

  return {
    users,
    loading,
    loadingMore,
    error,
    loadMore,
    hasMore,
  };
}