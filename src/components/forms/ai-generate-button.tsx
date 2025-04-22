import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { generateChallenge } from '@/lib/api/openai';
import { ChallengeFormData } from '@/types/challenge';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AIGenerateButtonProps {
  onGenerate: (data: ChallengeFormData) => void;
  onSuccess: () => void;
}

export function AIGenerateButton({ onGenerate, onSuccess }: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const handleGenerate = async () => {
    setError(null);
    try {
      setLoading(true);
      const challenge = await generateChallenge(additionalPrompt);
      onGenerate(challenge);
      onSuccess(); // Switch to manual mode after successful generation
      toast.success('Challenge generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate challenge';
      console.error('Error generating challenge:', error);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="additional-prompt">Additional Instructions (Optional)</Label>
        <Textarea
          id="additional-prompt"
          placeholder="Add any specific requirements or context for the AI generator..."
          value={additionalPrompt}
          onChange={(e) => setAdditionalPrompt(e.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handleGenerate}
        disabled={loading}
      >
        <Wand2 className="h-4 w-4" />
        {loading ? 'Generating...' : 'Generate with AI'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && !loading && (
        <Alert>
          <AlertDescription>
            Click the button above to generate a challenge using AI. The generated challenge will include realistic scenarios, product details, and training parameters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}