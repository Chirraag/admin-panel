import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar } from '@/types';

export function useAvatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'avatars'));
        const avatarsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Avatar));
        setAvatars(avatarsData);
      } catch (err) {
        setError('Failed to load avatars');
        console.error('Error fetching avatars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  return { avatars, loading, error };
}