import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, CategoryFormData } from '@/types/category';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sanitizeCategoryData } from '@/lib/utils/category';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryForm } from './category-form';
import { SaleTypesDialog } from './sale-types-dialog';
import { GoalsDialog } from './goals-dialog';
import { TransferDialog } from './transfer-dialog';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showSaleTypes, setShowSaleTypes] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        goals: doc.data().goals || [],
        sale_types: doc.data().sale_types || [],
        onEdit: (category: Category) => {
          setEditingCategory(category);
          setShowForm(true);
        },
        onDelete: (category: Category) => handleInitiateDelete(category),
        onManageSaleTypes: (category: Category) => {
          setSelectedCategoryId(category.id);
          setShowSaleTypes(true);
        },
        onManageGoals: (category: Category) => {
          setSelectedCategoryId(category.id);
          setShowGoals(true);
        },
      } as Category));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInitiateDelete = async (category: Category) => {
    try {
      // Check for challenges using this category
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('category_id', '==', category.id)
      );
      const challengesSnapshot = await getDocs(challengesQuery);
      const count = challengesSnapshot.size;

      setCategoryToDelete(category);
      
      if (count > 0) {
        setSubmissionCount(count);
        setShowTransfer(true);
      } else {
        setShowDeleteConfirmation(true);
      }
    } catch (error) {
      console.error('Error checking challenges:', error);
      toast.error('Failed to check category usage');
    }
  };

  const handleTransferAndDelete = async (newCategoryId: string) => {
    if (!categoryToDelete) return;

    try {
      // Update all challenges with the new category ID
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('category_id', '==', categoryToDelete.id)
      );
      const challengesSnapshot = await getDocs(challengesQuery);

      // Update each challenge
      const updatePromises = challengesSnapshot.docs.map(doc =>
        updateDoc(doc.ref, { category_id: newCategoryId })
      );
      await Promise.all(updatePromises);

      // Delete the category
      await deleteDoc(doc(db, 'categories', categoryToDelete.id));

      toast.success('Category deleted and challenges transferred successfully');
      setShowTransfer(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error transferring and deleting:', error);
      toast.error('Failed to transfer challenges and delete category');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete.id));
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setShowDeleteConfirmation(false);
      setCategoryToDelete(null);
    }
  };

  const handleCreate = async (data: CategoryFormData) => {
    try {
      const sanitizedData = {
        ...sanitizeCategoryData(data),
        goals: [],
        sale_types: []
      };
      const docRef = await addDoc(collection(db, 'categories'), sanitizedData);
      
      await updateDoc(doc(db, 'categories', docRef.id), {
        id: docRef.id
      });
      
      toast.success('Category created successfully');
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    try {
      const sanitizedData = sanitizeCategoryData(data);
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        ...sanitizedData,
        id: editingCategory.id
      });
      toast.success('Category updated successfully');
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleCancelDelete = () => {
    setCategoryToDelete(null);
    setShowDeleteConfirmation(false);
    setShowTransfer(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading categories...</div>
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <DataTable columns={columns} data={categories} />

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            initialData={editingCategory || undefined}
            onSubmit={editingCategory ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
          />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSaleTypes}
        onOpenChange={(open) => {
          setShowSaleTypes(open);
          if (!open) {
            setSelectedCategoryId(null);
          }
        }}
      >
        {selectedCategory && (
          <SaleTypesDialog
            categoryId={selectedCategory.id}
            saleTypes={selectedCategory.sale_types}
            onClose={() => setShowSaleTypes(false)}
            onUpdate={fetchCategories}
          />
        )}
      </Dialog>

      <Dialog
        open={showGoals}
        onOpenChange={(open) => {
          setShowGoals(open);
          if (!open) {
            setSelectedCategoryId(null);
          }
        }}
      >
        {selectedCategory && (
          <GoalsDialog
            categoryId={selectedCategory.id}
            goals={selectedCategory.goals}
            onClose={() => setShowGoals(false)}
            onUpdate={fetchCategories}
          />
        )}
      </Dialog>

      {/* Transfer Dialog */}
      {categoryToDelete && (
        <TransferDialog
          open={showTransfer}
          onOpenChange={(open) => {
            if (!open) handleCancelDelete();
          }}
          categoryToDelete={categoryToDelete}
          categories={categories}
          submissionCount={submissionCount}
          onConfirmTransfer={handleTransferAndDelete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteConfirmation} 
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}