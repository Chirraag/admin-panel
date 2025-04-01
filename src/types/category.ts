export interface VapiFileInfo {
  id: string;
  name: string;
  orgId: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
}

export interface SaleType {
  id: string;
  name: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  category_icon: string;
  knowledge_base: VapiFileInfo[];
  knowledge_base_dump: string;
  goals: Goal[];
  sale_types: SaleType[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onManageSaleTypes?: (category: Category) => void;
  onManageGoals?: (category: Category) => void;
}

export type CategoryFormData = Omit<Category, 'id' | 'onEdit' | 'onDelete' | 'onManageSaleTypes' | 'onManageGoals'>;