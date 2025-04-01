export interface Avatar {
  id: string;
  name: string;
  age: number;
  gender: string;
  description: string;
  ambient_sound: string;
  image_url: string;
  voice_id: string;
  volume: string;
  book_rate: 'Easy' | 'Medium' | 'Hard';
  key_personality_trait: string;
}

export type AvatarFormData = Omit<Avatar, 'id'>;