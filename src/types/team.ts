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
  company_logo: string;
  created_at: Timestamp;
  customers_desc: string;
  description: string;
  objections: string[];
  offerings_desc: string;
  status: 'Pending' | 'Approved' | 'Declined';
  team_leader_uid: string;
  touchpoints: string[];
  members: TeamMember[];
  
  // Fields available after approval
  team_code?: string;
  category?: string;
  challenges?: string[];
  website?: string;
  social_media?: SocialMediaLinks;
  knowledge_base?: string[];
}

export interface TeamFormData {
  name: string;
  company_logo: string;
  customers_desc: string;
  description: string;
  objections: string[];
  offerings_desc: string;
  touchpoints: string[];
}

export interface ApprovalFormData {
  team_code: string;
  category: string;
  website: string;
  social_media?: SocialMediaLinks;
  knowledge_base?: string[];
}