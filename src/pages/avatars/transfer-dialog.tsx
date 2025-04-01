import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Avatar } from '@/types/avatar';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarToDelete: Avatar;
  avatars: Avatar[];
  challengeCount: number;
  onConfirmTransfer: (newAvatarId: string) => Promise<void>;
}

export function TransferDialog({
  open,
  onOpenChange,
  avatarToDelete,
  avatars,
  challengeCount,
  onConfirmTransfer,
}: TransferDialogProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Reset selected avatar when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedAvatar('');
      setIsTransferring(false);
    }
  }, [open]);

  const handleTransfer = async () => {
    if (!selectedAvatar) return;
    
    setIsTransferring(true);
    try {
      await onConfirmTransfer(selectedAvatar);
    } finally {
      setIsTransferring(false);
    }
  };

  const availableAvatars = avatars.filter(a => a.id !== avatarToDelete.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Challenges</DialogTitle>
          <DialogDescription>
            There are {challengeCount} challenges using this avatar. 
            Please select a new avatar to transfer them to before deletion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedAvatar}
            onValueChange={setSelectedAvatar}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target avatar" />
            </SelectTrigger>
            <SelectContent>
              {availableAvatars.map((avatar) => (
                <SelectItem key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedAvatar || isTransferring}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer & Delete'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}