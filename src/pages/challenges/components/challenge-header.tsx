import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ChallengeHeaderProps {
  onAdd: () => void;
}

export function ChallengeHeader({ onAdd }: ChallengeHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
      <Button onClick={onAdd} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Challenge
      </Button>
    </div>
  );
}