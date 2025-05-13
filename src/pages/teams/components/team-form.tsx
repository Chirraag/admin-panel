/* src/components/team-form.tsx
   Form for team creation and editing using simplified member structure */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, Upload, Trash2, UserPlus, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Timestamp } from "firebase/firestore";

import { Team, TeamMember } from "@/types/team";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isSquareImage } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*                              Schema                                */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "SaaS Sales",
  "Real Estate",
  "Insurance",
  "Retail",
  "Healthcare",
  "Financial Services",
  "Technology",
  "Education",
  "Other",
] as const;

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  company_logo: z.string().min(1, "Logo is required"),
  website: z.string().url("Invalid website URL"),
  category: z.enum(CATEGORIES),
  customers_desc: z.string().min(1, "Customer description is required"),
  offerings_desc: z.string().min(1, "Offerings description is required"),
  social_media: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    twitter: z.string().optional(),
  }),
  members: z
    .array(
      z.object({
        member_id: z.string(),
        email: z.string().email(),
        user_name: z.string(),
        role: z.enum(["Leader", "Member"]),
        joined_at: z.any(),
      }),
    )
    .refine((members) => members.some((member) => member.role === "Leader"), {
      message: "Team must have at least one leader",
      path: ["members"],
    }),
});

/* ------------------------------------------------------------------ */
/*                             Component                              */
/* ------------------------------------------------------------------ */

interface TeamFormProps {
  initialData?: Partial<Team>;
  onSubmit: (data: Team) => Promise<void>;
  onCancel: () => void;
}

export function TeamForm({ initialData, onSubmit, onCancel }: TeamFormProps) {
  /* -------------------- state -------------------- */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [users, setUsers] = useState<
    { id: string; email: string; firstName?: string; lastName?: string }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [showNewMemberPopover, setShowNewMemberPopover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------ fetch users ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs
          .map((d) => ({
            id: d.id,
            email: d.data().email as string,
            firstName: d.data().firstName,
            lastName: d.data().lastName,
          }))
          .filter((u) => u.email);
        setUsers(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  /* -------------- filtered list memo ------------- */
  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        u.email.toLowerCase().includes(emailFilter.toLowerCase()),
      ),
    [users, emailFilter],
  );

  // Initialize the form with default empty members array if not provided
  const form = useForm<Team>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      company_logo: "",
      website: "",
      category: "SaaS Sales",
      customers_desc: "",
      offerings_desc: "",
      social_media: { instagram: "", tiktok: "", youtube: "", twitter: "" },
      members: [],
      ...initialData,
    },
  });

  // Helper to add a member to the team
  const addMember = (email: string, role: "Leader" | "Member") => {
    const user = users.find((u) => u.email === email);
    if (!user) {
      toast.error("User not found");
      return;
    }

    // Check if user is already a member
    const currentMembers = form.getValues("members") || [];
    if (currentMembers.some((m) => m.email === email)) {
      toast.error("User is already a team member");
      return;
    }

    // If adding a leader and there's already a leader, confirm the change
    if (role === "Leader" && currentMembers.some((m) => m.role === "Leader")) {
      // In a real app, you might want to show a confirmation dialog here
      // For simplicity, we'll just proceed and change the leadership
    }

    const user_name =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "";

    // Create the new member object with simplified structure
    const newMember: TeamMember = {
      member_id: user.id,
      email: user.email,
      user_name: user_name,
      role: role,
      joined_at: Timestamp.now(),
    };

    form.setValue("members", [...currentMembers, newMember]);
    setEmailFilter("");
    setShowNewMemberPopover(false);
    toast.success(`${role} added successfully`);
  };

  // Helper to remove a member
  const removeMember = (memberId: string) => {
    const currentMembers = form.getValues("members") || [];
    const member = currentMembers.find((m) => m.member_id === memberId);

    // Prevent removing the last leader
    if (
      member?.role === "Leader" &&
      currentMembers.filter((m) => m.role === "Leader").length <= 1
    ) {
      toast.error("Cannot remove the only team leader");
      return;
    }

    form.setValue(
      "members",
      currentMembers.filter((m) => m.member_id !== memberId),
    );
  };

  // Helper to change a member's role
  const changeMemberRole = (memberId: string, newRole: "Leader" | "Member") => {
    const currentMembers = form.getValues("members") || [];

    // If changing from leader to member, check if this is the only leader
    if (newRole === "Member") {
      const member = currentMembers.find((m) => m.member_id === memberId);
      if (
        member?.role === "Leader" &&
        currentMembers.filter((m) => m.role === "Leader").length <= 1
      ) {
        toast.error("Cannot change the only team leader to a member");
        return;
      }
    }

    form.setValue(
      "members",
      currentMembers.map((m) =>
        m.member_id === memberId ? { ...m, role: newRole } : m,
      ),
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be under 2 MB");
        return;
      }

      // Check if the image is square
      const isSquare = await isSquareImage(file);
      if (!isSquare) {
        toast.error("Please upload a square image");
        return;
      }

      const storageRef = ref(storage, `teams/logos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      console.log("Uploaded image URL:", url);

      const oldUrl = form.getValues("company_logo");
      if (oldUrl) {
        try {
          await deleteObject(ref(storage, oldUrl));
        } catch {
          /* ignore */
        }
      }

      form.setValue("company_logo", url);
      toast.success("Logo uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ------------------ submit --------------------- */
  const handleSubmit = async (data: Team) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all members for display
  const members = form.watch("members") || [];

  /* =================== render ==================== */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* ------------ left column ------------ */}
          <div className="space-y-6">
            {/* name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Members Section */}
            <FormField
              control={form.control}
              name="members"
              render={() => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Popover
                        open={showNewMemberPopover}
                        onOpenChange={setShowNewMemberPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Add Member
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3">
                          <div className="space-y-4">
                            <h3 className="font-medium">Add Team Member</h3>
                            <Input
                              placeholder="Search by email..."
                              onChange={(e) => setEmailFilter(e.target.value)}
                            />

                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {loadingUsers ? (
                                <p className="text-sm text-muted-foreground">
                                  Loading…
                                </p>
                              ) : filteredUsers.length ? (
                                filteredUsers.map((user) => {
                                  const isMember = members.some(
                                    (m) => m.email === user.email,
                                  );
                                  return (
                                    <div
                                      key={user.id}
                                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                                    >
                                      <span className="text-sm truncate">
                                        {user.email}
                                      </span>
                                      {isMember ? (
                                        <Badge variant="outline">
                                          Already added
                                        </Badge>
                                      ) : (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              addMember(user.email, "Leader")
                                            }
                                          >
                                            Leader
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              addMember(user.email, "Member")
                                            }
                                          >
                                            Member
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No matches found
                                </p>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* List of current members */}
                    {members.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                              <tr key={member.member_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {member.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                    variant={
                                      member.role === "Leader"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {member.role}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <div className="flex justify-end gap-2">
                                    {/* Only show change role if not the only leader */}
                                    {!(
                                      member.role === "Leader" &&
                                      members.filter((m) => m.role === "Leader")
                                        .length <= 1
                                    ) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          changeMemberRole(
                                            member.member_id,
                                            member.role === "Leader"
                                              ? "Member"
                                              : "Leader",
                                          )
                                        }
                                      >
                                        Make{" "}
                                        {member.role === "Leader"
                                          ? "Member"
                                          : "Leader"}
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeMember(member.member_id)
                                      }
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md text-gray-500 bg-gray-50">
                        No team members added yet. Add at least one team leader.
                      </div>
                    )}

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://" />
                  </FormControl>
                  <FormDescription>Used for training context</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ------------ right column ------------ */}
          <div className="space-y-6">
            {/* logo upload */}
            <FormField
              control={form.control}
              name="company_logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Logo</FormLabel>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    </div>

                    {field.value && (
                      <div className="relative aspect-square w-40 rounded-lg overflow-hidden border">
                        <img
                          src={field.value}
                          alt="Team logo"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => form.setValue("company_logo", "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* customer description */}
            <FormField
              control={form.control}
              name="customers_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your target customers"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* offerings description */}
            <FormField
              control={form.control}
              name="offerings_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offerings Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your product/service offerings"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* social media */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Social Media Links</h3>

              {(["instagram", "tiktok", "youtube", "twitter"] as const).map(
                (key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={`social_media.${key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">{key}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              key === "youtube" ? "Channel URL" : "@username"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData?.id ? "Updating…" : "Creating…"}
              </>
            ) : initialData?.id ? (
              "Update Team"
            ) : (
              "Create Team"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
