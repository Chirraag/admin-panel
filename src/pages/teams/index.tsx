import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TeamDocument } from '@/types/team';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamForm } from './components/team-form';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

function generateTeamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDocument | null>(null);

  const fetchTeams = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        onApprove: async (team: TeamDocument) => {
          try {
            const teamCode = generateTeamCode();
            await updateDoc(doc.ref, {
              status: 'Approved',
              team_code: teamCode,
              updated_at: serverTimestamp(),
            });
            toast.success('Team approved successfully');
            navigate(`/dashboard/teams/${team.id}`);
          } catch (error) {
            console.error('Error approving team:', error);
            toast.error('Failed to approve team');
          }
        },
        onDecline: async (team: TeamDocument) => {
          try {
            await updateDoc(doc.ref, {
              status: 'Declined',
              updated_at: serverTimestamp(),
            });
            toast.success('Team declined');
            fetchTeams();
          } catch (error) {
            console.error('Error declining team:', error);
            toast.error('Failed to decline team');
          }
        },
      } as TeamDocument));
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      const teamCode = generateTeamCode();
      
      const newTeam = {
        ...data,
        status: 'Approved',
        team_code: teamCode,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        members: [],
      };

      const docRef = await addDoc(collection(db, 'teams'), newTeam);
      toast.success('Team created successfully');
      setShowForm(false);
      navigate(`/dashboard/teams/${docRef.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const handleApprove = async (data: any) => {
    if (!selectedTeam) return;

    try {
      const teamCode = generateTeamCode();

      await updateDoc(doc(db, 'teams', selectedTeam.id), {
        ...data,
        status: 'Approved',
        team_code: teamCode,
        updated_at: serverTimestamp(),
      });

      toast.success('Team approved successfully');
      setShowForm(false);
      setSelectedTeam(null);
      navigate(`/dashboard/teams/${selectedTeam.id}`);
    } catch (error) {
      console.error('Error approving team:', error);
      toast.error('Failed to approve team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <Button 
          onClick={() => {
            setSelectedTeam(null);
            setShowForm(true);
          }} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Team
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={teams} 
        onRowClick={(team) => {
          if (team.status === 'Approved') {
            navigate(`/dashboard/teams/${team.id}`);
          }
        }}
      />

      <Dialog 
        open={showForm} 
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setSelectedTeam(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] p-0">
          <ScrollArea className="max-h-[85vh] p-6">
            <DialogHeader>
              <DialogTitle>
                {selectedTeam ? `Approve Team: ${selectedTeam.name}` : 'Create New Team'}
              </DialogTitle>
            </DialogHeader>
            <TeamForm
              initialData={selectedTeam || undefined}
              onSubmit={selectedTeam ? handleApprove : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setSelectedTeam(null);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}