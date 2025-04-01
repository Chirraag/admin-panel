import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFormData } from '@/types/avatar';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { TransferDialog } from './transfer-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AvatarForm } from './avatar-form';
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

// Sanitize data before sending to Firestore
const sanitizeAvatarData = (data: AvatarFormData) => {
  return {
    name: data.name || '',
    age: Number(data.age) || 0,
    gender: data.gender || '',
    description: data.description || '',
    ambient_sound: data.ambient_sound || '',
    image_url: data.image_url || '',
    voice_id: data.voice_id || '',
    volume: data.volume || '1',
    key_personality_trait: data.key_personality_trait || '',
    book_rate: data.book_rate || 'Easy',
  };
};

export function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);
  const [avatarToDelete, setAvatarToDelete] = useState<Avatar | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fetchAvatars = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'avatars'));
      const avatarsData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            onEdit: (avatar: Avatar) => {
              setEditingAvatar(avatar);
              setShowForm(true);
            },
            onDelete: (avatar: Avatar) => handleInitiateDelete(avatar),
          } as Avatar)
      );
      setAvatars(avatarsData);
    } catch (error) {
      console.error('Error fetching avatars:', error);
      toast.error('Failed to load avatars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const handleCreate = async (data: AvatarFormData) => {
    try {
      const sanitizedData = sanitizeAvatarData(data);
      await addDoc(collection(db, 'avatars'), sanitizedData);
      toast.success('Avatar created successfully');
      setShowForm(false);
      fetchAvatars();
    } catch (error) {
      console.error('Error creating avatar:', error);
      toast.error('Failed to create avatar');
    }
  };

  const handleUpdate = async (data: AvatarFormData) => {
    if (!editingAvatar) return;
    try {
      const sanitizedData = sanitizeAvatarData(data);
      await updateDoc(doc(db, 'avatars', editingAvatar.id), sanitizedData);
      toast.success('Avatar updated successfully');
      setShowForm(false);
      setEditingAvatar(null);
      fetchAvatars();
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    }
  };

  const handleInitiateDelete = async (avatar: Avatar) => {
    try {
      // Check for challenges using this avatar
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('avatar', '==', avatar.id)
      );
      const challengesSnapshot = await getDocs(challengesQuery);
      const count = challengesSnapshot.size;

      setAvatarToDelete(avatar);
      
      if (count > 0) {
        setChallengeCount(count);
        setShowTransfer(true);
      } else {
        setShowDeleteConfirmation(true);
      }
    } catch (error) {
      console.error('Error checking challenges:', error);
      toast.error('Failed to check avatar usage');
    }
  };

  const handleTransferAndDelete = async (newAvatarId: string) => {
    if (!avatarToDelete) return;

    try {
      const batch = writeBatch(db);

      // Update all challenges with the new avatar ID
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('avatar', '==', avatarToDelete.id)
      );
      const challengesSnapshot = await getDocs(challengesQuery);

      // Add all challenge updates to the batch
      challengesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { avatar: newAvatarId });
      });

      // Delete the avatar
      batch.delete(doc(db, 'avatars', avatarToDelete.id));

      // Commit all changes
      await batch.commit();

      toast.success('Avatar deleted and challenges transferred successfully');
      setShowTransfer(false);
      setAvatarToDelete(null);
      fetchAvatars();
    } catch (error) {
      console.error('Error transferring and deleting:', error);
      toast.error('Failed to transfer challenges and delete avatar');
    }
  };

  const handleDelete = async () => {
    if (!avatarToDelete) return;
    try {
      await deleteDoc(doc(db, 'avatars', avatarToDelete.id));
      toast.success('Avatar deleted successfully');
      fetchAvatars();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    } finally {
      setShowDeleteConfirmation(false);
      setAvatarToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setAvatarToDelete(null);
    setShowDeleteConfirmation(false);
    setShowTransfer(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading avatars...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Avatars</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Avatar
        </Button>
      </div>

      <DataTable columns={columns} data={avatars} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle>
              {editingAvatar ? 'Edit Avatar' : 'Create Avatar'}
            </DialogTitle>
          </DialogHeader>
          <AvatarForm
            initialData={editingAvatar || undefined}
            onSubmit={editingAvatar ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingAvatar(null);
            }}
          />
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
              This action cannot be undone. This will permanently delete the avatar.
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

      {/* Transfer Dialog */}
      {avatarToDelete && (
        <TransferDialog
          open={showTransfer}
          onOpenChange={(open) => {
            if (!open) handleCancelDelete();
          }}
          avatarToDelete={avatarToDelete}
          avatars={avatars}
          challengeCount={challengeCount}
          onConfirmTransfer={handleTransferAndDelete}
        />
      )}
    </div>
  );
}
