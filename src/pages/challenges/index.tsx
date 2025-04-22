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
import { sanitizeChallengeData } from '@/lib/utils/challenge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const PAGE_SIZE_OPTIONS = [
  { value: "5", label: "5 rows" },
  { value: "10", label: "10 rows" },
  { value: "20", label: "20 rows" },
  { value: "50", label: "50 rows" }
];

const ALL_CATEGORIES_VALUE = "all";

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_VALUE);
  const [pageSize, setPageSize] = useState<string>("10");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengesSnapshot, categoriesSnapshot] = await Promise.all([
          getDocs(collection(db, 'challenges')),
          getDocs(collection(db, 'categories'))
        ]);

        const categoriesData = categoriesSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as Category;
          return acc;
        }, {} as Record<string, Category>);
        setCategoriesMap(categoriesData);

        const challengesData = challengesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Challenge));
        setChallenges(challengesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreate = async (data: ChallengeFormData) => {
    try {
      const sanitizedData = sanitizeChallengeData(data);
      
      if (sanitizedData.isFree) {
        sanitizedData.credits = 0;
      }
      
      await addDoc(collection(db, 'challenges'), sanitizedData);
      toast.success('Challenge created successfully');
      setShowForm(false);
      const snapshot = await getDocs(collection(db, 'challenges'));
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    }
  };

  const handleUpdate = async (data: ChallengeFormData) => {
    if (!editingChallenge) return;
    try {
      const sanitizedData = sanitizeChallengeData(data);
      
      if (sanitizedData.isFree) {
        sanitizedData.credits = 0;
      }
      
      await updateDoc(doc(db, 'challenges', editingChallenge.id), sanitizedData);
      toast.success('Challenge updated successfully');
      setShowForm(false);
      setEditingChallenge(null);
      const snapshot = await getDocs(collection(db, 'challenges'));
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
      setChallenges(challengesData);
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
      const snapshot = await getDocs(collection(db, 'challenges'));
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
      setChallenges(challengesData);
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

  const filteredChallenges = challenges
    .filter(challenge => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === ALL_CATEGORIES_VALUE || challenge.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .map(challenge => ({
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
      
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
            {Object.values(categoriesMap).map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={pageSize}
          onValueChange={setPageSize}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredChallenges}
        pageSize={parseInt(pageSize)}
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