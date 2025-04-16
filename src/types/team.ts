import { Timestamp } from 'firebase/firestore';

export interface SocialMediaLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
}

export interface TeamMember {
  email: string;
  user_id: string | null;
  joined_at: Timestamp;
  status: 'pending' | 'active';
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'script';
}

export interface TeamDocument {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  team_leader_email: string;
  created_at: Timestamp;
  team_code: string;
  website: string;
  category: string;
  social_media: SocialMediaLinks;
  knowledge_base: KnowledgeBaseItem[];
  members: TeamMember[];
  is_loading_challenges: boolean;
  challenges_loaded: boolean;
  onView?: (team: TeamDocument) => void;
  onEdit?: (team: TeamDocument) => void;
  onDelete?: (team: TeamDocument) => void;
  onManageMembers?: (team: TeamDocument) => void;
}

export interface TeamFormData {
  name: string;
  description: string;
  logo_url: string;
  team_leader_email: string;
  website: string;
  category: string;
  social_media: SocialMediaLinks;
}