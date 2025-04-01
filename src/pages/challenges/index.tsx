import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Challenge, ChallengeFormData } from '@/types/challenge';
import { Category } from '@/types/category';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { ChallengeForm } from './challenge-form';
import { ChallengeHeader } from './components/challenge-header';
import { TestChallengeDialog } from './components/test-challenge-dialog';
import { useChallenges } from '@/hooks/use-challenges';
import { sanitizeChallengeData } from '@/lib/utils/challenge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';

export function ChallengesPage() {
  const { challenges, loading, error, refreshChallenges } = useChallenges();
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as Category;
          return acc;
        }, {} as Record<string, Category>);
        setCategoriesMap(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleCreate = async (data: ChallengeFormData) => {
    try {
      const sanitizedData = sanitizeChallengeData(data);
      
      // If the challenge is free, set credits to 0
      if (sanitizedData.isFree) {
        sanitizedData.credits = 0;
      }
      
      await addDoc(collection(db, 'challenges'), sanitizedData);
      toast.success('Challenge created successfully');
      setShowForm(false);
      refreshChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    }
  };

  const handleUpdate = async (data: ChallengeFormData) => {
    if (!editingChallenge) return;
    try {
      const sanitizedData = sanitizeChallengeData(data);
      
      // If the challenge is free, set credits to 0
      if (sanitizedData.isFree) {
        sanitizedData.credits = 0;
      }
      
      await updateDoc(doc(db, 'challenges', editingChallenge.id), sanitizedData);
      toast.success('Challenge updated successfully');
      setShowForm(false);
      setEditingChallenge(null);
      refreshChallenges();
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast.error('Failed to update challenge');
    }
  };

  const handleDelete = async () => {
    if (!challengeToDelete) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeToDelete.id));
      toast.success('Challenge deleted successfully');
      refreshChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    } finally {
      setChallengeToDelete(null);
    }
  };

  const handleTestChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowTestDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading challenges...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading challenges: {error}
      </div>
    );
  }

  const challengesWithCategories = challenges.map(challenge => ({
    ...challenge,
    category: categoriesMap[challenge.category_id],
    onEdit: (c: Challenge) => {
      setEditingChallenge({
        ...c,
        category_id: c.category_id || ''
      });
      setShowForm(true);
    },
    onDelete: (c: Challenge) => setChallengeToDelete(c),
    onTest: (c: Challenge) => handleTestChallenge(c),
  }));

  return (
    <div className="space-y-4">
      <ChallengeHeader onAdd={() => setShowForm(true)} />
      
      <DataTable 
        columns={columns} 
        data={challengesWithCategories}
      />

      <Dialog 
        open={showForm} 
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingChallenge(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh] p-6">
            <ChallengeForm
              initialData={editingChallenge || undefined}
              onSubmit={editingChallenge ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingChallenge(null);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedChallenge && (
        <TestChallengeDialog
          challenge={selectedChallenge}
          open={showTestDialog}
          onOpenChange={setShowTestDialog}
        />
      )}

      <AlertDialog open={!!challengeToDelete} onOpenChange={() => setChallengeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the challenge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}