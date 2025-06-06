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
import { Course, CourseFormData, Video } from "@/types/course";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MembersDialog } from "./components/members-dialog";
import { Button } from "@/components/ui/button";
import { ChallengeImportTab } from "./components/ChallengeImportTab";
import { CourseForm } from "@/pages/courses/course-form";
import { DataTable } from "@/components/data-table/data-table";
import { deleteVideo } from "@/lib/s3";
import {
  Users,
  FileText,
  Trophy,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
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
import { CourseImportTab } from "./components/course-import-tab";
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

// Course columns for team courses table
const createTeamCourseColumns = (
  onEdit: (course: Course) => void,
  onDelete: (course: Course) => void,
) => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }: any) => {
      const course = row.original;
      return (
        <div className="flex items-center gap-4">
          {course.wall_image && (
            <img
              src={course.wall_image}
              alt={course.title}
              className="h-12 w-20 object-cover rounded"
            />
          )}
          <span>{course.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "author_name",
    header: "Author",
  },
  {
    accessorKey: "videos",
    header: "Videos",
    cell: ({ row }: any) => {
      const videos = row.getValue("videos") as Course["videos"];
      return videos?.length || 0;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }: any) => {
      const date = row.getValue("created_at") as any;
      if (!date) return "N/A";

      try {
        if (date && typeof date.toDate === "function") {
          return format(date.toDate(), "MMM dd, yyyy");
        }
        if (date instanceof Date) {
          return format(date, "MMM dd, yyyy");
        }
        return "N/A";
      } catch (error) {
        return "N/A";
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const course = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(course)}
            title="Edit course"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(course)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete course"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDocument | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  );
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(
    null,
  );
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const handleImportCourse = async (course: Course) => {
    if (!team) return;

    try {
      // Create a new course in this team's subcollection
      // Clone all data but create a new ID
      const { id, course_id, ...courseData } = course;

      // Add the course to team's courses subcollection
      const docRef = await addDoc(
        collection(doc(db, "teams", team.id), "courses"),
        {
          ...courseData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
      );

      // Update the document with its own ID
      await updateDoc(docRef, {
        course_id: docRef.id,
      });

      toast.success("Course imported successfully");
      setShowCourseForm(false);

      // Refresh courses
      fetchTeamData();
    } catch (error) {
      console.error("Error importing course:", error);
      toast.error("Failed to import course");
    }
  };

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

      // Fetch team courses from subcollection
      const coursesSnapshot = await getDocs(
        collection(doc(db, "teams", teamId), "courses"),
      );
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        course_id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(coursesData);
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

  // Challenge handlers (existing)
  const handleCreateChallenge = async (data: ChallengeFormData) => {
    if (!team) return;

    try {
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
      fetchTeamData();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const handleImportChallenge = async (challenge: Challenge) => {
    if (!team) return;

    try {
      const { id, ...challengeData } = challenge;

      await addDoc(collection(doc(db, "teams", team.id), "challenges"), {
        ...challengeData,
        dateAt: serverTimestamp(),
      });

      toast.success("Challenge imported successfully");
      setShowChallengeForm(false);
      fetchTeamData();
    } catch (error) {
      console.error("Error importing challenge:", error);
      toast.error("Failed to import challenge");
    }
  };

  const handleUpdateChallenge = async (data: ChallengeFormData) => {
    if (!team || !editingChallenge) return;

    try {
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
      fetchTeamData();
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error("Failed to update challenge");
    }
  };

  const handleDeleteChallenge = async () => {
    if (!team || !challengeToDelete) return;

    try {
      await deleteDoc(
        doc(db, "teams", team.id, "challenges", challengeToDelete.id),
      );

      toast.success("Challenge deleted successfully");
      setChallengeToDelete(null);
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

  // Course handlers (new)
  const handleCreateCourse = async (data: CourseFormData, videos: Video[]) => {
    if (!team) return;

    try {
      const timestamp = serverTimestamp();
      const courseData = {
        ...data,
        videos,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const docRef = await addDoc(
        collection(doc(db, "teams", team.id), "courses"),
        courseData,
      );

      // Update the document with its own ID
      await updateDoc(docRef, {
        course_id: docRef.id,
      });

      toast.success("Course created successfully");
      setShowCourseForm(false);
      setEditingCourse(null);
      fetchTeamData();
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course");
    }
  };

  const handleUpdateCourse = async (data: CourseFormData, videos: Video[]) => {
    if (!team || !editingCourse) return;

    try {
      // Only delete videos that were explicitly removed
      const removedVideos = editingCourse.videos.filter(
        (oldVideo) => !videos.some((newVideo) => newVideo.id === oldVideo.id),
      );

      // Delete removed videos from S3
      for (const video of removedVideos) {
        await deleteVideo(video.url);
      }

      // Update the course with new data and videos
      await updateDoc(doc(db, "teams", team.id, "courses", editingCourse.id), {
        ...data,
        videos,
        updated_at: serverTimestamp(),
      });

      toast.success("Course updated successfully");
      setShowCourseForm(false);
      setEditingCourse(null);
      fetchTeamData();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    }
  };

  const handleDeleteCourse = async () => {
    if (!team || !courseToDelete) return;

    setIsDeletingCourse(true);
    try {
      // Delete all videos from S3
      const deletePromises = courseToDelete.videos.map((video) =>
        deleteVideo(video.url),
      );
      await Promise.all(deletePromises);

      // Delete course from team's courses subcollection
      await deleteDoc(doc(db, "teams", team.id, "courses", courseToDelete.id));

      toast.success("Course and all videos deleted successfully");
      setCourseToDelete(null);
      fetchTeamData();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  // Team details handler (existing)
  const handleUpdateDetails = async (data: any) => {
    if (!team) return;

    try {
      const updateData = {
        name: data.name,
        description: data.description,
        category: data.category,
        website: data.website,
        team_leader_email: data.team_leader_email,
        company_logo: data.company_logo,
        customers_desc: data.customers_desc,
        offerings_desc: data.offerings_desc,
        social_media: data.social_media,
        updated_at: serverTimestamp(),
        ...(data.knowledge_base && {
          knowledge_base: data.knowledge_base.map((file: any) => ({
            id: file.id,
            name: file.name,
            url: file.url,
            type: file.type,
          })),
        }),
      };

      await updateDoc(doc(db, "teams", team.id), updateData);

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

  // Create columns with handlers
  const courseColumns = createTeamCourseColumns(
    handleEditCourse,
    setCourseToDelete,
  );

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
      <div className="grid grid-cols-4 gap-4">
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
            <BookOpen className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Courses</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{courses.length}</p>
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
            <TabsTrigger value="courses">Courses</TabsTrigger>
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

          <TabsContent value="courses" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Team Courses</h3>
              <Button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseForm(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </div>
            <DataTable columns={courseColumns} data={courses} />
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
              <DialogTitle>
                {editingChallenge ? "Edit Challenge" : "Create Challenge"}
              </DialogTitle>
            </DialogHeader>

            {editingChallenge ? (
              <ChallengeForm
                initialData={editingChallenge}
                onSubmit={handleUpdateChallenge}
                onCancel={() => {
                  setShowChallengeForm(false);
                  setEditingChallenge(null);
                }}
              />
            ) : (
              <Tabs defaultValue="manual" className="mt-4">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="manual">Create new</TabsTrigger>
                  <TabsTrigger value="import">Import from Public</TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                  <ChallengeForm
                    initialData={undefined}
                    onSubmit={handleCreateChallenge}
                    onCancel={() => setShowChallengeForm(false)}
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

      <Dialog
        open={showCourseForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowCourseForm(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create Course"}
            </DialogTitle>
          </DialogHeader>

          {editingCourse ? (
            // When editing, show the form directly with scrolling
            <ScrollArea className="max-h-[calc(90vh-6rem)] pr-6">
              <CourseForm
                initialData={editingCourse}
                videos={editingCourse.videos || []}
                onSubmit={handleUpdateCourse}
                onCancel={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}
              />
            </ScrollArea>
          ) : (
            // When creating new, show tabs with proper scrolling
            <div className="max-h-[calc(90vh-6rem)]">
              <Tabs defaultValue="create" className="h-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="create">Create New</TabsTrigger>
                  <TabsTrigger value="import">Import from Library</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-0">
                  <ScrollArea className="h-[calc(90vh-12rem)] pr-6">
                    <CourseForm
                      onSubmit={handleCreateCourse}
                      onCancel={() => setShowCourseForm(false)}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="import" className="mt-0">
                  <ScrollArea className="h-[calc(90vh-12rem)] pr-6">
                    <CourseImportTab onImport={handleImportCourse} />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
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
      <AlertDialog
        open={!!courseToDelete}
        onOpenChange={() => !isDeletingCourse && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course and all its videos from both the database and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCourse}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingCourse}
            >
              {isDeletingCourse ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
