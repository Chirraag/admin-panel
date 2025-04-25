import { Timestamp } from 'firebase/firestore';

export interface SocialMediaLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  user_id: string;
  uuid: string;
  joined_at: Timestamp;
}

export interface TeamDocument {
  id: string;
  name: string;
  description: string;
  company_logo?: string;
  team_leader_email: string;
  website: string;
  category: string;
  customers_desc: string;
  offerings_desc: string;
  objections: string[];
  touchpoints: string[];
  social_media?: SocialMediaLinks;
  status: 'Pending' | 'Approved' | 'Declined';
  created_at?: Timestamp;
  updated_at?: Timestamp;
  team_code?: string;
  members?: TeamMember[];
  onApprove?: (team: TeamDocument) => void;
  onDecline?: (team: TeamDocument) => void;
}

export interface TeamFormData {
  name: string;
  description: string;
  company_logo?: string;
  team_leader_email: string;
  website: string;
  category: string;
  customers_desc: string;
  offerings_desc: string;
  objections: string[];
  touchpoints: string[];
  social_media?: SocialMediaLinks;
}