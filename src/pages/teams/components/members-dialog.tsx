import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TeamDocument, TeamMember } from '@/types/team';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MembersDialogProps {
  team: TeamDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: User[];
}

export function MembersDialog({ team, open, onOpenChange, availableUsers }: MembersDialogProps) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleAddMember = async () => {
    const emailToAdd = selectedUser || email.trim();
    if (!emailToAdd || adding) return;

    setAdding(true);
    try {
      // Check if member already exists
      if (team.members?.some(member => member.email === emailToAdd)) {
        toast.error('User is already a team member');
        return;
      }

      // Find user ID if they exist in the system
      const matchingUser = availableUsers.find(user => user.email === emailToAdd);

      const newMember: TeamMember = {
        email: emailToAdd,
        user_id: matchingUser?.id || null,
        joined_at: new Date(),
        status: 'pending'
      };

      const updatedMembers = [...(team.members || []), newMember];

      await updateDoc(doc(db, 'teams', team.id), {
        members: updatedMembers
      });

      toast.success('Team member added successfully');
      setEmail('');
      setSelectedUser('');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    try {
      const updatedMembers = team.members.filter(member => member.email !== memberEmail);
      
      await updateDoc(doc(db, 'teams', team.id), {
        members: updatedMembers
      });

      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    if (date instanceof Date) return date.toLocaleDateString();
    if (date.toDate && typeof date.toDate === 'function') return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const availableEmails = availableUsers
    .filter(user => !team.members?.some(member => member.email === user.email))
    .map(user => user.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            {availableEmails.length > 0 ? (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmails.map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1"
              />
            )}
            <Button onClick={handleAddMember} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.members?.map((member) => (
                <TableRow key={member.email}>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(member.joined_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}