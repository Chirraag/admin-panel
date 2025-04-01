import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SaleType } from '@/types/category';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SaleTypeForm } from './sale-type-form';

interface SaleTypesDialogProps {
  categoryId: string;
  saleTypes: SaleType[];
  onClose: () => void;
  onUpdate: () => void;
}

export function SaleTypesDialog({ categoryId, saleTypes, onClose, onUpdate }: SaleTypesDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSaleType, setEditingSaleType] = useState<SaleType | null>(null);
  const [saleTypeToDelete, setSaleTypeToDelete] = useState<SaleType | null>(null);

  const handleCreate = async (data: Omit<SaleType, 'id'>) => {
    try {
      const newSaleType: SaleType = {
        id: crypto.randomUUID(),
        ...data
      };

      await updateDoc(doc(db, 'categories', categoryId), {
        sale_types: [...saleTypes, newSaleType]
      });

      toast.success('Sale type created successfully');
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating sale type:', error);
      toast.error('Failed to create sale type');
    }
  };

  const handleUpdate = async (data: Omit<SaleType, 'id'>) => {
    if (!editingSaleType) return;
    try {
      const updatedSaleTypes = saleTypes.map(saleType => 
        saleType.id === editingSaleType.id ? { ...saleType, ...data } : saleType
      );

      await updateDoc(doc(db, 'categories', categoryId), {
        sale_types: updatedSaleTypes
      });

      toast.success('Sale type updated successfully');
      setShowForm(false);
      setEditingSaleType(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating sale type:', error);
      toast.error('Failed to update sale type');
    }
  };

  const handleDelete = async () => {
    if (!saleTypeToDelete) return;
    try {
      const updatedSaleTypes = saleTypes.filter(saleType => saleType.id !== saleTypeToDelete.id);
      
      await updateDoc(doc(db, 'categories', categoryId), {
        sale_types: updatedSaleTypes
      });

      toast.success('Sale type deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting sale type:', error);
      toast.error('Failed to delete sale type');
    } finally {
      setSaleTypeToDelete(null);
    }
  };

  return (
    <>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sale Types</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Sale Type
          </Button>

          <div className="grid gap-4">
            {saleTypes.map((saleType) => (
              <div
                key={saleType.id}
                className="flex items-start justify-between p-4 rounded-lg border"
              >
                <div>
                  <h3 className="font-medium">{saleType.name}</h3>
                  <p className="text-sm text-gray-500">{saleType.description}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingSaleType(saleType);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setSaleTypeToDelete(saleType)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingSaleType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSaleType ? 'Edit Sale Type' : 'Create Sale Type'}
            </DialogTitle>
          </DialogHeader>
          <SaleTypeForm
            initialData={editingSaleType || undefined}
            onSubmit={editingSaleType ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingSaleType(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!saleTypeToDelete}
        onOpenChange={() => setSaleTypeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}