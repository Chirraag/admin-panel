export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdTime: Date;
  goal: string;
  role: 'admin' | 'user';
  needHelpWith: string;
  referralCode: string;
  salesType: string;
  struggle: string;
  user_credits: number;
  is_credits_locked: boolean;
  onViewSubmissions?: (user: User) => void;
  onDelete?: (user: User) => void;
  onEdit?: (user: User) => void;
}

export interface AdminFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  user_credits: number;
  is_credits_locked: boolean;
}