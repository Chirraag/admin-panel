/* src/components/team-form.tsx
   Fully self-contained form with searchable “Team Leader Email” combobox
   (Popover + Input filter) — no cmdk required. */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { TeamFormData } from "@/types/team";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  logo_url: z.string().min(1, "Logo is required"),
  team_leader_email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid website URL"),
  category: z.enum(CATEGORIES),
  social_media: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    twitter: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/*                             Component                              */
/* ------------------------------------------------------------------ */

interface TeamFormProps {
  initialData?: Partial<TeamFormData>;
  onSubmit: (data: TeamFormData & { team_leader_id?: string }) => Promise<void>;
  onCancel: () => void;
}

export function TeamForm({ initialData, onSubmit, onCancel }: TeamFormProps) {
  /* -------------------- state -------------------- */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------ fetch users ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs
          .map((d) => ({ id: d.id, email: d.data().email as string }))
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

  /* --------------- react-hook-form --------------- */
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      logo_url: "",
      team_leader_email: "",
      website: "",
      category: "SaaS Sales",
      social_media: { instagram: "", tiktok: "", youtube: "", twitter: "" },
      ...initialData,
    },
  });

  /* ---------------- logo upload ------------------ */
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

      const storageRef = ref(storage, `teams/logos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const oldUrl = form.getValues("logo_url");
      if (oldUrl) {
        try {
          await deleteObject(ref(storage, oldUrl));
        } catch {
          /* ignore */
        }
      }

      form.setValue("logo_url", url);
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
  const handleSubmit = async (data: TeamFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const leader = users.find((u) => u.email === data.team_leader_email);
      await onSubmit({ ...data, team_leader_id: leader?.id });
    } finally {
      setIsSubmitting(false);
    }
  };

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

            {/* combobox: team leader email */}
            <FormField
              control={form.control}
              name="team_leader_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader Email</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value || "Select / search e-mail"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-80 p-3">
                      <Input
                        placeholder="Type to filter…"
                        onChange={(e) => setEmailFilter(e.target.value)}
                        className="mb-3"
                      />

                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {loadingUsers ? (
                          <p className="text-sm text-muted-foreground">
                            Loading…
                          </p>
                        ) : filteredUsers.length ? (
                          filteredUsers.map((u) => (
                            <Button
                              key={u.id}
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                form.setValue("team_leader_email", u.email);
                              }}
                            >
                              {u.email}
                            </Button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No matches.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <FormDescription>
                    We’ll email the team leader activation instructions.
                  </FormDescription>
                  <FormMessage />
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
              name="logo_url"
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
                          onClick={() => form.setValue("logo_url", "")}
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
                {initialData ? "Updating…" : "Creating…"}
              </>
            ) : initialData ? (
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
