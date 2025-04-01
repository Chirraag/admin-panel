export interface Goal {
  id: string;
  name: string;
  description: string;
}

export type GoalFormData = Omit<Goal, 'id'>;