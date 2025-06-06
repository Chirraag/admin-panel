export interface VapiFileInfo {
  id: string;
  name: string;
  orgId: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  image_url?: string; // New field for goal image
}

export interface SaleType {
  id: string;
  name: string;
  description: string;
  image_url?: string; // New field for sale type image
}

export interface Category {
  id: string;
  name: string;
  description: string;
  category_icon: string;
  image_url?: string; // New field for SVG icon (changed from svg_icon_url)
  knowledge_base: VapiFileInfo[];
  knowledge_base_dump: string;
  goals: Goal[];
  sale_types: SaleType[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onManageSaleTypes?: (category: Category) => void;
  onManageGoals?: (category: Category) => void;
}

export type CategoryFormData = Omit<
  Category,
  "id" | "onEdit" | "onDelete" | "onManageSaleTypes" | "onManageGoals"
>;
