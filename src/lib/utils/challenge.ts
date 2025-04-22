import { ChallengeFormData } from '@/types/challenge';

const VALID_TYPES = [
  'Cold Call',
  '1:1 Meeting',
  'Relationship Building',
  'Price Drop',
  'Offer Delivery'
];

export const sanitizeChallengeData = (data: ChallengeFormData) => {
  // Ensure type is one of the valid options
  const type = (data.type || 'Cold Call');
  if (!VALID_TYPES.includes(type)) {
    throw new Error('Invalid challenge type');
  }

  // Convert objections array to string
  const objectionString = data.objections?.join('\n') || '';

  return {
    title: (data.title || '').trim(),
    type,
    description: (data.description || '').trim(),
    duration: Number(data.duration) || 300,
    avatar: data.avatar || '',
    isFree: Boolean(data.isFree),
    features: (data.features || []).map(f => f.trim().toLowerCase()),
    pain_points: (data.pain_points || []).map(p => p.trim().toLowerCase()),
    product_name: data.product_name || '',
    product_description: data.product_description || '',
    prospect_data: data.prospect_data || '',
    prospect_objection: objectionString, // Store objections as a single string
    training_type: type, // Set training_type to match type
    category_id: data.category_id || '',
    objections: data.objections || [], // Keep original array for form state
    talking_points: (data.talking_points || []).map(t => t.trim()),
    credits: Number(data.credits),
  };
};