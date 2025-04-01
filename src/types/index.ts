export interface Avatar {
  age: number;
  ambient_sound: string;
  description: string;
  gender: string;
  image_url: string;
  name: string;
  voice_id: string;
  volume: string;
}

export interface Challenge {
  type: string;
  avatar: string;
  isFree: boolean;
  pain_points: string;
  product_description: string;
  product_name: string;
  prospect_data: string;
  prospect_objection: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}