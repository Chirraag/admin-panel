import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TeamDocument } from "@/types/team";
import { Challenge, ChallengeFormData } from "@/types/challenge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MembersDialog } from "./components/members-dialog";
import { Button } from "@/components/ui/button";
import { ChallengeImportTab } from "./components/ChallengeImportTab";
import {
  Users,
  FileText,
  Trophy,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamDetailsForm } from "./components/team-details-form";
import { ChallengeForm } from "@/pages/challenges/challenge-form";
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

export function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDocument | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  );
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(
    null,
  );

  const fetchTeamData = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch team details
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (!teamDoc.exists()) {
        throw new Error("Team not found");
      }

      const teamData = {
        id: teamDoc.id,
        ...teamDoc.data(),
        members: teamDoc.data().members || [],
      } as TeamDocument;

      setTeam(teamData);

      // Fetch team challenges from subcollection
      const challengesSnapshot = await getDocs(
        collection(doc(db, "teams", teamId), "challenges"),
      );
      const challengesData = challengesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Challenge[];
      setChallenges(challengesData);
    } catch (error) {
      console.error("Error fetching team data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching team data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const handleCreateChallenge = async (data: ChallengeFormData) => {
    if (!team) return;

    try {
      // Add challenge to team's challenges subcollection
      const challengeData = {
        ...data,
        dateAt: serverTimestamp(),
      };

      await addDoc(
        collection(doc(db, "teams", team.id), "challenges"),
        challengeData,
      );

      toast.success("Challenge created successfully");
      setShowChallengeForm(false);
      setEditingChallenge(null);

      // Refresh challenges
      fetchTeamData();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const handleImportChallenge = async (challenge: Challenge) => {
    if (!team) return;

    try {
      // Create a new challenge in this team's subcollection
      // Clone all data but create a new ID
      const { id, ...challengeData } = challenge;

      // Add the challenge to team's challenges subcollection
      await addDoc(collection(doc(db, "teams", team.id), "challenges"), {
        ...challengeData,
        dateAt: serverTimestamp(),
      });

      toast.success("Challenge imported successfully");
      setShowChallengeForm(false);

      // Refresh challenges
      fetchTeamData();
    } catch (error) {
      console.error("Error importing challenge:", error);
      toast.error("Failed to import challenge");
    }
  };

  const handleUpdateChallenge = async (data: ChallengeFormData) => {
    if (!team || !editingChallenge) return;

    try {
      // Update challenge in team's challenges subcollection
      await updateDoc(
        doc(db, "teams", team.id, "challenges", editingChallenge.id),
        {
          ...data,
          updated_at: serverTimestamp(),
        },
      );

      toast.success("Challenge updated successfully");
      setShowChallengeForm(false);
      setEditingChallenge(null);

      // Refresh challenges
      fetchTeamData();
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error("Failed to update challenge");
    }
  };

  const handleDeleteChallenge = async () => {
    if (!team || !challengeToDelete) return;

    try {
      // Delete challenge from team's challenges subcollection
      await deleteDoc(
        doc(db, "teams", team.id, "challenges", challengeToDelete.id),
      );

      toast.success("Challenge deleted successfully");
      setChallengeToDelete(null);

      // Refresh challenges
      fetchTeamData();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("Failed to delete challenge");
    }
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setShowChallengeForm(true);
  };

  const handleUpdateDetails = async (data: any) => {
    if (!team) return;

    try {
      // Create the update object with all fields
      const updateData = {
        name: data.name,
        description: data.description,
        category: data.category,
        website: data.website,
        team_leader_email: data.team_leader_email,
        company_logo: data.company_logo, // Make sure this is included
        customers_desc: data.customers_desc, // Make sure this is included
        offerings_desc: data.offerings_desc, // Make sure this is included
        social_media: data.social_media,
        updated_at: serverTimestamp(),
        // Only include knowledge_base if it exists in data
        ...(data.knowledge_base && {
          knowledge_base: data.knowledge_base.map((file: any) => ({
            id: file.id,
            name: file.name,
            url: file.url,
            type: file.type,
          })),
        }),
      };

      // Update the document
      await updateDoc(doc(db, "teams", team.id), updateData);

      // Update local state
      setTeam((prev) =>
        prev
          ? {
              ...prev,
              ...updateData,
            }
          : null,
      );

      toast.success("Team details updated successfully");
    } catch (error) {
      console.error("Error updating team details:", error);
      toast.error("Failed to update team details");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";

    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM dd, yyyy");
      }

      if (date instanceof Date || typeof date === "number") {
        return format(date, "MMM dd, yyyy");
      }

      return "N/A";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading team details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900">Team not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/teams")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {team.company_logo && (
            <img
              src={team.company_logo}
              alt={team.name}
              className="h-16 w-16 object-contain rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-500">
              Created {formatDate(team.dateAt)}
            </p>
            {team.team_code && (
              <div className="flex items-center">
                <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                  Team Code: {team.team_code}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowMembersDialog(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manage Members
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Team Members</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{team.members?.length || 0}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Challenges</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{challenges.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Knowledge Base</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {team.knowledge_base?.length || 0}
          </p>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full border-b">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-6">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Team Code</h3>
              <p className="mt-1 text-lg font-mono">
                {team.team_code || "N/A"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Share this code with team members to join
              </p>
            </div>
            <TeamDetailsForm team={team} onSave={handleUpdateDetails} />
          </TabsContent>

          <TabsContent value="members" className="p-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{formatDate(member.joined_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center py-4 text-gray-500"
                      >
                        No members yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="challenges" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Team Challenges</h3>
              <Button
                onClick={() => {
                  setEditingChallenge(null);
                  setShowChallengeForm(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Challenge
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.length > 0 ? (
                    challenges.map((challenge) => (
                      <TableRow key={challenge.id}>
                        <TableCell>{challenge.title}</TableCell>
                        <TableCell>{challenge.type}</TableCell>
                        <TableCell>{challenge.duration}s</TableCell>
                        <TableCell>
                          <Badge
                            variant={challenge.isFree ? "secondary" : "default"}
                          >
                            {challenge.isFree ? "Free" : "Premium"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditChallenge(challenge)}
                              title="Edit challenge"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setChallengeToDelete(challenge)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete challenge"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-gray-500"
                      >
                        No challenges yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      <MembersDialog
        team={team}
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        onUpdate={fetchTeamData}
      />

      <Dialog open={showChallengeForm} onOpenChange={setShowChallengeForm}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0">
          <ScrollArea className="max-h-[85vh] p-6">
            <DialogHeader>
              <DialogTitle>Create Challenge</DialogTitle>
            </DialogHeader>

            {/* Check if your ChallengeForm has its own tabs structure and integrate with it */}
            {editingChallenge ? (
              // When editing, just show the form directly without tabs
              <ChallengeForm
                initialData={editingChallenge}
                onSubmit={handleUpdateChallenge}
                onCancel={() => {
                  setShowChallengeForm(false);
                  setEditingChallenge(null);
                }}
              />
            ) : (
              // When creating new, show tabs with all three options
              <Tabs defaultValue="manual" className="mt-4">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="manual">Create new</TabsTrigger>
                  <TabsTrigger value="import">Import from Public</TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-4">
                  {/* AI Generation content */}
                  <div className="space-y-4">
                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      placeholder="Add any specific requirements or context for the AI generator..."
                    />
                    <Button className="w-full">Generate with AI</Button>
                    <div className="p-4 bg-gray-50 rounded-md text-sm">
                      Click the button above to generate a challenge using AI.
                      The generated challenge will include realistic scenarios,
                      product details, and training parameters.
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manual">
                  {/* Use the ChallengeForm but possibly with a prop to avoid showing its own tabs */}
                  <ChallengeForm
                    initialData={undefined}
                    onSubmit={handleCreateChallenge}
                    onCancel={() => setShowChallengeForm(false)}
                    hideInternalTabs={true} // Add this prop if your ChallengeForm has this option
                  />
                </TabsContent>

                <TabsContent value="import">
                  <ChallengeImportTab onImport={handleImportChallenge} />
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!challengeToDelete}
        onOpenChange={() => setChallengeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this challenge? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChallenge}
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
