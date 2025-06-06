import { useForm } from "react-hook-form";
import { SaleTypeFormData } from "@/types/sale-type";
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
import {
  uploadSaleTypeImage,
  deleteStorageImage,
} from "@/lib/firebase-storage";
import { toast } from "sonner";

interface SaleTypeFormProps {
  categoryId: string;
  initialData?: Partial<SaleTypeFormData>;
  onSubmit: (data: SaleTypeFormData) => Promise<void>;
  onCancel: () => void;
}

const saleTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image_url: z.string().min(1, "SVG image is required"),
});

export function SaleTypeForm({
  categoryId,
  initialData,
  onSubmit,
  onCancel,
}: SaleTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<SaleTypeFormData>({
    resolver: zodResolver(saleTypeSchema),
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
      toast.error("Only SVG files are allowed for sale type images");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      // Generate a temporary ID for new sale types
      const saleTypeId = initialData?.name
        ? initialData.name.toLowerCase().replace(/\s+/g, "-")
        : `temp-${Date.now()}`;

      const imageUrl = await uploadSaleTypeImage(file, categoryId, saleTypeId);
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

  const handleSubmit = async (data: SaleTypeFormData) => {
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
                <Input {...field} placeholder="e.g., Inbound Booked Calls" />
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
                  placeholder="e.g., I handle calls with leads who book calls on our website"
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
                Sale Type SVG Image <span className="text-red-500">*</span>
              </FormLabel>
              <div className="space-y-4">
                {currentImageUrl && (
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50">
                    <div className="w-16 h-16 bg-white rounded border flex items-center justify-center overflow-hidden">
                      <img
                        src={currentImageUrl}
                        alt="Sale Type SVG Image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Sale Type SVG Image Uploaded
                      </p>
                      <p className="text-xs text-gray-500">
                        Visual representation for this sale type
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
                    id="sale-type-image-upload"
                    disabled={isUploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("sale-type-image-upload")?.click()
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
                  Upload an SVG file that represents this sale type. Only .svg
                  files are allowed.
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
              "Update Sale Type"
            ) : (
              "Create Sale Type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
