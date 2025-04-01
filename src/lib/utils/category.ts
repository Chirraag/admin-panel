import { CategoryFormData } from '@/types/category';

export const sanitizeCategoryData = (data: CategoryFormData) => {
  return {
    name: (data.name || '').trim(),
    description: (data.description || '').trim(),
    category_icon: (data.category_icon || '').trim(),
    knowledge_base: Array.isArray(data.knowledge_base) ? data.knowledge_base.filter(Boolean) : [],
    knowledge_base_dump: (data.knowledge_base_dump || '').trim()
  };
};