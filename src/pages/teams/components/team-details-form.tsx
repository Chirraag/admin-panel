import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Team } from "@/types/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, X, Check, Upload } from "lucide-react";
import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { isSquareImage } from "@/lib/utils";

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

const detailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(CATEGORIES),
  website: z.string().url("Invalid website URL"),
  company_logo: z.string().optional(),
  social_media: z.object({
    youtube: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
    twitter: z
      .string()
      .min(1, "Twitter handle is required")
      .optional()
      .or(z.literal("")),
    instagram: z
      .string()
      .min(1, "Instagram handle is required")
      .optional()
      .or(z.literal("")),
    tiktok: z
      .string()
      .min(1, "TikTok handle is required")
      .optional()
      .or(z.literal("")),
  }),
  customers_desc: z.string().min(1, "Customer description is required"),
  offerings_desc: z.string().min(1, "Offerings description is required"),
});

interface TeamDetailsFormProps {
  team: Team;
  onSave: (data: Partial<Team>) => Promise<void>;
  defaultEditMode?: boolean;
}

export function TeamDetailsForm({
  team,
  onSave,
  defaultEditMode = false,
}: TeamDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(defaultEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const form = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: team.name || "",
      description: team.description || "",
      category: (team.category as any) || "SaaS Sales",
      website: team.website || "",
      company_logo: team.company_logo || "",
      customers_desc: team.customers_desc || "",
      offerings_desc: team.offerings_desc || "",
      social_media: {
        youtube: team.social_media?.youtube || "",
        twitter: team.social_media?.twitter || "",
        instagram: team.social_media?.instagram || "",
        tiktok: team.social_media?.tiktok || "",
      },
    },
  });

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);

      // Validate image type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate image size
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

      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `teams/logos/${Date.now()}-${file.name}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const url = await getDownloadURL(storageRef);

      form.setValue("company_logo", url);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  // In src/pages/teams/components/team-details-form.tsx
  // Find the handleSubmit function and modify it to ensure the data is properly formatted
  // In src/pages/teams/components/team-details-form.tsx
  // Replace the handleSubmit function with this improved version

  const handleSubmit = async (data: z.infer<typeof detailsSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Form data before submission:", data);

      // Step 1: Create a clean data object with explicit properties
      const submissionData = {
        name: data.name || "",
        description: data.description || "",
        category: data.category || "SaaS Sales",
        website: data.website || "",
        customers_desc: data.customers_desc || "",
        offerings_desc: data.offerings_desc || "",
        // Include company_logo only if it exists
        ...(data.company_logo ? { company_logo: data.company_logo } : {}),
        // Ensure social_media is properly structured
        social_media: {
          instagram: data.social_media?.instagram || "",
          tiktok: data.social_media?.tiktok || "",
          youtube: data.social_media?.youtube || "",
          twitter: data.social_media?.twitter || "",
        },
      };

      console.log("Cleaned submission data:", submissionData);

      // Step 2: Call the parent's onSave function with our cleaned data
      await onSave(submissionData);

      // Step 3: Exit edit mode on success
      setIsEditing(false);
    } catch (error) {
      console.error("Form submission error:", error);
      // Show a local error message
      toast.error(
        "Form submission failed. Please check the console for details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Details
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
              <p className="mt-1 text-lg">{team.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{team.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1">{team.category}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Website</h3>
              <p className="mt-1">
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {team.website}
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Customer Description
              </h3>
              <p className="mt-1">{team.customers_desc}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Offerings Description
              </h3>
              <p className="mt-1">{team.offerings_desc}</p>
            </div>
          </div>

          <div className="space-y-6">
            {team.company_logo && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Company Logo
                </h3>
                <div className="mt-2 relative aspect-square w-40 rounded-lg overflow-hidden border">
                  <img
                    src={team.company_logo}
                    alt={team.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Social Media
              </h3>
              <div className="mt-2 space-y-2">
                {team.social_media?.instagram && (
                  <p>Instagram: @{team.social_media.instagram}</p>
                )}
                {team.social_media?.tiktok && (
                  <p>TikTok: @{team.social_media.tiktok}</p>
                )}
                {team.social_media?.youtube && (
                  <p>YouTube: {team.social_media.youtube}</p>
                )}
                {team.social_media?.twitter && (
                  <p>Twitter: @{team.social_media.twitter}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
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
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customers_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offerings_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offerings Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="company_logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Logo</FormLabel>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("logo-upload")?.click()
                        }
                        disabled={uploadingLogo}
                        className="w-full"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
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
                          alt="Company logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Social Media Links</h3>
              <FormField
                control={form.control}
                name="social_media.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_media.tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_media.youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Channel URL" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_media.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X (Twitter)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
