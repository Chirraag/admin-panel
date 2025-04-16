import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TeamDocument, TeamFormData } from "@/types/team";
import { User } from "@/types/user";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamForm } from "./components/team-form";
import { MembersDialog } from "./components/members-dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
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

function generateTeamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDocument | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamDocument | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamDocument | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const fetchTeams = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teams"));
      const teamsData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            onView: (team: TeamDocument) =>
              navigate(`/dashboard/teams/${team.id}`),
            onEdit: (team: TeamDocument) =>
              navigate(`/dashboard/teams/${team.id}`),
            onDelete: (team: TeamDocument) => setTeamToDelete(team),
            onManageMembers: (team: TeamDocument) => {
              setSelectedTeam(team);
              setShowMembers(true);
            },
          }) as TeamDocument,
      );
      setTeams(teamsData);

      // Fetch users for email suggestions
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (
    data: TeamFormData & { team_leader_id?: string },
  ) => {
    try {
      const timestamp = serverTimestamp();

      // Create the team document first
      const docRef = await addDoc(collection(db, "teams"), {
        ...data,
        team_code: generateTeamCode(),
        created_at: timestamp,
        is_loading_challenges: true,
        challenges_loaded: false,
        members: [
          {
            email: data.team_leader_email,
            user_id: data.team_leader_id,
            joined_at: timestamp,
            status: "active",
          },
        ],
        knowledge_base: [],
      });

      // Update the document with its own ID
      await updateDoc(doc(db, "teams", docRef.id), {
        id: docRef.id,
      });

      // Create the challenge generation request
      await addDoc(collection(db, "team_challenge_requests"), {
        team_id: docRef.id,
        created_at: timestamp,
        status: "pending",
      });

      toast.success("Team created successfully");
      setShowForm(false);
      fetchTeams();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    }
  };

  const handleUpdate = async (
    data: TeamFormData & { team_leader_id?: string },
  ) => {
    if (!editingTeam) return;
    try {
      await updateDoc(doc(db, "teams", editingTeam.id), {
        ...data,
        updated_at: serverTimestamp(),
      });

      toast.success("Team updated successfully");
      setShowForm(false);
      setEditingTeam(null);
      fetchTeams();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    }
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    try {
      // Delete team challenges
      const challengesQuery = query(
        collection(db, "challenges"),
        where("team_id", "==", teamToDelete.id),
      );
      const challengesSnapshot = await getDocs(challengesQuery);
      const challengeDeletions = challengesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );

      // Wait for all deletions to complete
      await Promise.all(challengeDeletions);

      // Finally, delete the team
      await deleteDoc(doc(db, "teams", teamToDelete.id));

      toast.success("Team deleted successfully");
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    } finally {
      setTeamToDelete(null);
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
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      <DataTable columns={columns} data={teams} />

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTeam(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] p-0">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? "Edit Team" : "Create Team"}
                </DialogTitle>
              </DialogHeader>
              <TeamForm
                initialData={editingTeam || undefined}
                onSubmit={editingTeam ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTeam(null);
                }}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!teamToDelete}
        onOpenChange={() => setTeamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This will remove all
              team members, challenges, and associated data. This action cannot
              be undone.
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

      {selectedTeam && (
        <MembersDialog
          team={selectedTeam}
          open={showMembers}
          onOpenChange={setShowMembers}
          availableUsers={users}
        />
      )}
    </div>
  );
}
