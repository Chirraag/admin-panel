export interface Goal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

export type GoalFormData = Omit<Goal, 'id'>;