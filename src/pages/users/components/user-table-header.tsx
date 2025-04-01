import { Button } from '@/components/ui/button';
import { Plus, UserCog } from 'lucide-react';

interface UserTableHeaderProps {
  onAddAdmin: () => void;
}

export function UserTableHeader({ onAddAdmin }: UserTableHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <Button 
        onClick={onAddAdmin} 
        className="flex items-center gap-2"
      >
        <UserCog className="h-4 w-4" />
        Add Admin
      </Button>
    </div>
  );
}