import { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { X, Check, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { db } from '@/lib/firebase';
import { TeamDocument, TeamMember } from '@/types/team';
import { User } from '@/types/user';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const tsToString = (ts?: Timestamp) =>
  ts?.toDate ? format(ts.toDate(), 'MMM dd, yyyy') : '—';

interface MembersDialogProps {
  team: TeamDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function MembersDialog({
  team,
  open,
  onOpenChange,
  onUpdate,
}: MembersDialogProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [available, setAvailable] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as User),
        );

        setAllUsers(users);

        const validUsers = users.filter(
          (u) => typeof u.email === 'string' && u.email.trim() !== ''
        );
        setAvailable(validUsers);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load users');
      }
    };

    if (open) {
      load();
      setSearchTerm('');
      setShowSuggestions(false);
    }
  }, [open]);

  // Handle clicks outside of search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const memberRows = useMemo(() => team.members ?? [], [team.members]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return available.filter(user => 
      user.email?.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term)
    );
  }, [available, searchTerm]);

  const addMember = async (user: User) => {
    if (!user || !user.email) {
      toast.error('Invalid user selection');
      return;
    }

    if ((team.members ?? []).some((m) => m.user_id === user.id)) {
      toast.error('User already in team');
      return;
    }

    try {
      setBusy(true);

      const now = new Date();
      
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email,
        uuid: user.id,
        joined_at: Timestamp.fromDate(now),
      };

      const updated = [...(team.members ?? []), newMember];
      await updateDoc(doc(db, 'teams', team.id), { members: updated });
      team.members = updated;

      setSearchTerm('');
      setShowSuggestions(false);
      toast.success('Member added');
      onUpdate?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to add member');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const updated = (team.members ?? []).filter((m) => m.id !== memberId);
      await updateDoc(doc(db, 'teams', team.id), { members: updated });
      team.members = updated;
      toast.success('Member removed');
      onUpdate?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-9"
              />
            </div>

            {showSuggestions && searchTerm && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg">
                <ScrollArea className="h-[200px]">
                  {filteredUsers.length > 0 ? (
                    <div className="py-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3",
                            "focus:outline-none focus:bg-gray-50",
                            (team.members ?? []).some(m => m.user_id === user.id) && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => addMember(user)}
                          disabled={busy || (team.members ?? []).some(m => m.user_id === user.id)}
                        >
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-primary/10">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                          {(team.members ?? []).some(m => m.user_id === user.id) ? (
                            <span className="text-xs text-gray-400">Already added</span>
                          ) : (
                            <Check className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No users found
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 border rounded-lg">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-gray-50">Email</TableHead>
                    <TableHead className="bg-gray-50">Joined</TableHead>
                    <TableHead className="bg-gray-50 w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberRows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{tsToString(m.joined_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(m.id)}
                          disabled={busy}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}