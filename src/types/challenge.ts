export interface Challenge {
  id: string;
  title: string;
  type: string;
  description: string;
  duration: number;
  avatar: string;
  isFree: boolean;
  features: string[];
  pain_points: string[];
  product_name: string;
  product_description: string;
  prospect_data: string;
  prospect_objection: string;
  training_type: string;
  category_id: string;
  objections: string[];
  talking_points: string[];
  credits: number;
  onEdit?: (challenge: Challenge) => void;
  onDelete?: (challenge: Challenge) => void;
}

export type ChallengeFormData = Omit<Challenge, 'id' | 'onEdit' | 'onDelete'>;