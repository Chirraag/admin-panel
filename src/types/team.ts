// Define member roles
export type MemberRole = "Leader" | "Member";

// Simplified Team Member structure
export interface TeamMember {
  member_id: string; // UUID of the user (references user document ID)
  email: string; // User's email
  user_name: string;
  role: MemberRole; // Role in the team
  joined_at: any; // Timestamp
}

// Unified Team interface - used for both form and database
export interface Team {
  id?: string; // Document ID (only present for existing teams)
  name: string;
  description: string;
  company_logo: string;
  website: string;
  category: string;
  customers_desc: string;
  offerings_desc: string;
  social_media: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  members: TeamMember[];

  // Fields that might not be present during form input but added later
  status?: "Pending" | "Approved" | "Declined";
  team_code?: string;
  dateAt?: any; // Timestamp
  updated_at?: any; // Timestamp
  knowledge_base?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  objections?: string[];
  touchpoints?: string[];

  // UI action handlers (not in DB, only in component state)
  onApprove?: (team: Team) => void;
  onDecline?: (team: Team) => void;
  onView?: (team: Team) => void;
}
