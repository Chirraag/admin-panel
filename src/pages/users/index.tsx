import { UsersTable } from './components/users-table';
import { UserTableHeader } from './components/user-table-header';
import { useUsers } from '@/hooks/use-users';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
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
import { useState } from 'react';
import { User, AdminFormData, UserFormData } from '@/types/user';
import { UserSubmissionsDialog } from './components/user-submissions-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminForm } from './components/admin-form';
import { UserForm } from './components/user-form';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function UsersPage() {
  const { users, loading, loadingMore, error, loadMore, hasMore } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCreateAdmin = async (data: AdminFormData) => {
    try {
      // Create the auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Create the user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'admin',
        createdTime: serverTimestamp(),
        user_credits: 0,
        is_credits_locked: false,
      });

      toast.success('Admin user created successfully');
      setShowAdminForm(false);
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Failed to create admin user');
    }
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!userToEdit) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userToEdit.id), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        user_credits: data.user_credits,
        is_credits_locked: data.is_credits_locked,
      });
      
      toast.success('User updated successfully');
      // Refresh the users list
      loadMore(true);
      setShowUserForm(false);
      setUserToEdit(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      toast.success('Admin user deleted successfully');
      // Refresh the users list using the hook's refresh function
      loadMore(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete admin user');
    } finally {
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowUserForm(true);
  };

  const usersWithActions = users.map(user => ({
    ...user,
    onViewSubmissions: (user: User) => {
      setSelectedUser(user);
      setShowSubmissions(true);
    },
    onDelete: (user: User) => {
      setUserToDelete(user);
    },
    onEdit: (user: User) => {
      handleEditUser(user);
    }
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <UserTableHeader onAddAdmin={() => setShowAdminForm(true)} />
      <UsersTable 
        users={usersWithActions}
        onLoadMore={loadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
      />

      {selectedUser && (
        <UserSubmissionsDialog
          open={showSubmissions}
          onOpenChange={setShowSubmissions}
          userId={selectedUser.id}
          userName={`${selectedUser.firstName} ${selectedUser.lastName}`}
        />
      )}

      <Dialog open={showAdminForm} onOpenChange={setShowAdminForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
          </DialogHeader>
          <AdminForm
            onSubmit={handleCreateAdmin}
            onCancel={() => setShowAdminForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {userToEdit && (
            <UserForm
              initialData={{
                firstName: userToEdit.firstName,
                lastName: userToEdit.lastName,
                email: userToEdit.email,
                role: userToEdit.role as 'admin' | 'user',
                user_credits: userToEdit.user_credits || 0,
                is_credits_locked: userToEdit.is_credits_locked || false,
              }}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setShowUserForm(false);
                setUserToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}