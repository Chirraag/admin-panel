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
import { Category } from '@/types/category';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToDelete: Category;
  categories: Category[];
  submissionCount: number;
  onConfirmTransfer: (newCategoryId: string) => Promise<void>;
}

export function TransferDialog({
  open,
  onOpenChange,
  categoryToDelete,
  categories,
  submissionCount,
  onConfirmTransfer,
}: TransferDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Reset selected category when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCategory('');
      setIsTransferring(false);
    }
  }, [open]);

  const handleTransfer = async () => {
    if (!selectedCategory) return;
    
    setIsTransferring(true);
    try {
      await onConfirmTransfer(selectedCategory);
    } finally {
      setIsTransferring(false);
    }
  };

  const availableCategories = categories.filter(c => c.id !== categoryToDelete.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Submissions</DialogTitle>
          <DialogDescription>
            There are {submissionCount} submissions using this category. 
            Please select a new category to transfer them to before deletion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
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
              disabled={!selectedCategory || isTransferring}
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