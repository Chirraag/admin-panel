import { ChallengeFormData } from '@/types/challenge';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateChallenge(): Promise<ChallengeFormData> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const prompt = `Create a realistic sales training challenge. Format the response as a JSON object with these exact fields:
  {
    "title": "string",
    "type": "string",
    "description": "string",
    "duration": number,
    "features": ["string"],
    "pain_points": ["string"],
    "product_name": "string",
    "product_description": "string",
    "prospect_data": "string",
    "prospect_objection": "string",
    "training_type": "string",
    "isFree": boolean,
    "avatar": "string",
    "category_id": "string",
    "objections": ["string"],
    "talking_points": ["string"],
    "credits": number
  }

  Make it realistic with:
  - A compelling cold call or demo scenario
  - Detailed product features and benefits (at least 3-5 features)
  - Specific customer pain points (at least 3-5 points)
  - Realistic prospect profile and objections
  - 3-5 common objections the prospect might raise
  - 3-5 key talking points for the sales rep
  - Appropriate training parameters
  - The type should be one of: "Cold Call", "1:1 Meeting", "Relationship Building", "Price Drop", "Offer Delivery"
  - Duration should be between 180-600 seconds
  - Credits should be 10`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate challenge');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    let challengeData;
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      challengeData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parsing error:', e);
      throw new Error('Invalid response format from AI');
    }

    return {
      title: challengeData.title || 'New Challenge',
      type: challengeData.type || 'Cold Call',
      description: challengeData.description || '',
      duration: Number(challengeData.duration) || 300,
      features: Array.isArray(challengeData.features) ? challengeData.features : [],
      pain_points: Array.isArray(challengeData.pain_points) ? challengeData.pain_points : [],
      product_name: challengeData.product_name || '',
      product_description: challengeData.product_description || '',
      prospect_data: challengeData.prospect_data || '',
      prospect_objection: challengeData.prospect_objection || '',
      training_type: challengeData.training_type || 'Cold Call',
      isFree: Boolean(challengeData.isFree),
      avatar: challengeData.avatar || '',
      category_id: challengeData.category_id || '',
      objections: Array.isArray(challengeData.objections) ? challengeData.objections : [],
      talking_points: Array.isArray(challengeData.talking_points) ? challengeData.talking_points : [],
      credits: Number(challengeData.credits) || 10,
    };
  } catch (error) {
    console.error('Error generating challenge:', error);
    throw error instanceof Error ? error : new Error('Failed to generate challenge');
  }
}