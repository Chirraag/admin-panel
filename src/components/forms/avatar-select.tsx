import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar } from '@/types/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar as AvatarUI, AvatarImage } from '@/components/ui/avatar';

interface AvatarSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function AvatarSelect({ value, onValueChange }: AvatarSelectProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'avatars'));
        const avatarsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Avatar));
        setAvatars(avatarsData);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select an avatar">
          {value && avatars.find(a => a.id === value)?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {avatars.map((avatar) => (
          <SelectItem key={avatar.id} value={avatar.id}>
            <div className="flex items-center gap-2">
              <AvatarUI className="h-6 w-6">
                <AvatarImage src={avatar.image_url} alt={avatar.name} />
              </AvatarUI>
              <span>{avatar.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}