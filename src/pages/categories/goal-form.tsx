import { useForm } from "react-hook-form";
import { GoalFormData } from "@/types/goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { uploadGoalImage, deleteStorageImage } from "@/lib/firebase-storage";
import { toast } from "sonner";

interface GoalFormProps {
  categoryId: string;
  initialData?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
}

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image_url: z.string().min(1, "SVG image is required"),
});

export function GoalForm({
  categoryId,
  initialData,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
      ...initialData,
    },
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate SVG file type
    if (file.type !== "image/svg+xml") {
      toast.error("Only SVG files are allowed for goal images");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      // Generate a temporary ID for new goals
      const goalId = initialData?.name
        ? initialData.name.toLowerCase().replace(/\s+/g, "-")
        : `temp-${Date.now()}`;

      const imageUrl = await uploadGoalImage(file, categoryId, goalId);
      form.setValue("image_url", imageUrl);

      // Clear the input
      event.target.value = "";

      toast.success("SVG image uploaded successfully");
    } catch (error) {
      console.error("Error uploading SVG:", error);
      toast.error("Failed to upload SVG image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    const currentImageUrl = form.getValues("image_url");

    if (currentImageUrl) {
      try {
        await deleteStorageImage(currentImageUrl);
        form.setValue("image_url", "");
        toast.success("SVG image removed successfully");
      } catch (error) {
        console.error("Error removing SVG:", error);
        toast.error("Failed to remove SVG image");
      }
    }
  };

  const handleSubmit = async (data: GoalFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentImageUrl = form.watch("image_url");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Increase Sales by 50%" />
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
              <FormLabel>
                Description <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., Achieve a 50% increase in quarterly sales through improved cold calling techniques"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Goal SVG Image <span className="text-red-500">*</span>
              </FormLabel>
              <div className="space-y-4">
                {currentImageUrl && (
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50">
                    <div className="w-16 h-16 bg-white rounded border flex items-center justify-center overflow-hidden">
                      <img
                        src={currentImageUrl}
                        alt="Goal SVG Image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Goal SVG Image Uploaded
                      </p>
                      <p className="text-xs text-gray-500">
                        Visual representation for this goal
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="goal-image-upload"
                    disabled={isUploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("goal-image-upload")?.click()
                    }
                    className="w-full"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading SVG...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentImageUrl
                          ? "Replace SVG Image"
                          : "Upload SVG Image"}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Upload an SVG file that represents this goal. Only .svg files
                  are allowed.
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Updating..." : "Creating..."}
              </>
            ) : initialData ? (
              "Update Goal"
            ) : (
              "Create Goal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
