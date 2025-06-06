export interface SaleType {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

export type SaleTypeFormData = Omit<SaleType, "id">;
