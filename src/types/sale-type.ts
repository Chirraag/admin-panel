export interface SaleType {
  id: string;
  name: string;
  description: string;
}

export type SaleTypeFormData = Omit<SaleType, 'id'>;