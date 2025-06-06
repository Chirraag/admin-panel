import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CourseFormData, Video, VideoFormData } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Youtube, Plus } from "lucide-react";
import { uploadVideo } from "@/lib/s3";
import { VideoList } from "./components/video-list";
import { VideoForm } from "./components/video-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  author_name: z.string().min(1, "Author name is required"),
  wall_image: z.string().min(1, "Course wall image is required"),
  course_credits: z.number().min(0, "Credits must be a positive number"),
});

interface CourseFormProps {
  initialData?: Partial<CourseFormData>;
  videos?: Video[];
  onSubmit: (data: CourseFormData, videos: Video[]) => Promise<void>;
  onCancel: () => void;
}

export function CourseForm({
  initialData,
  videos = [],
  onSubmit,
  onCancel,
}: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseVideos, setCourseVideos] = useState<Video[]>(videos);
  const [uploading, setUploading] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    file: File;
    progress: number;
    url: string;
  } | null>(null);
  const [uploadingWallImage, setUploadingWallImage] = useState(false);
  const [videoAddType, setVideoAddType] = useState<"upload" | "youtube">(
    "upload",
  );
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingYoutube, setAddingYoutube] = useState(false);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      author_name: "",
      wall_image: "",
      course_credits: 0,
      ...initialData,
    },
  });

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const extractVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      const videoId =
        urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
      return `YouTube Video ${videoId}`;
    } catch {
      return "YouTube Video";
    }
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress({ file, progress: 0, url: "" });

      const url = await uploadVideo(file, (progress) => {
        setUploadProgress((prev) => (prev ? { ...prev, progress } : null));
      });

      // Create a temporary video element to get duration
      const video = document.createElement("video");
      video.src = url;

      const getDuration = new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          resolve(Math.floor(video.duration));
        };
      });

      const video_duration = await getDuration;

      setUploadProgress((prev) => (prev ? { ...prev, url } : null));
      setShowVideoForm(true);

      const tempVideo: Video = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: "",
        url,
        video_duration,
        thumbnail: "",
        order: courseVideos.length,
        created_at: new Date() as any,
      };

      setCourseVideos((prev) => [...prev, tempVideo]);
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
      setUploadProgress(null);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleYouTubeAdd = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    try {
      setAddingYoutube(true);

      const tempVideo: Video = {
        id: crypto.randomUUID(),
        title: extractVideoTitle(youtubeUrl),
        description: "",
        url: youtubeUrl,
        video_duration: 0, // YouTube videos don't need duration from our side
        thumbnail: "", // Will be set in the form
        order: courseVideos.length,
        created_at: new Date() as any,
      };

      setCourseVideos((prev) => [...prev, tempVideo]);
      setShowVideoForm(true);
      setYoutubeUrl("");
      toast.success("YouTube video added");
    } catch (error) {
      console.error("Error adding YouTube video:", error);
      toast.error("Failed to add YouTube video");
    } finally {
      setAddingYoutube(false);
    }
  };

  const handleWallImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingWallImage(true);
      const url = await uploadVideo(file);
      form.setValue("wall_image", url);
      toast.success("Wall image uploaded successfully");
    } catch (error) {
      console.error("Error uploading wall image:", error);
      toast.error("Failed to upload wall image");
    } finally {
      setUploadingWallImage(false);
      event.target.value = "";
    }
  };

  const handleVideoFormSubmit = (data: VideoFormData) => {
    setCourseVideos((prev) => {
      const lastVideo = prev[prev.length - 1];
      return prev.map((video) =>
        video.id === lastVideo.id ? { ...video, ...data } : video,
      );
    });
    setShowVideoForm(false);
    toast.success("Video details updated successfully");
  };

  const handleSubmit = async (data: CourseFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data, courseVideos);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoReorder = (reorderedVideos: Video[]) => {
    setCourseVideos((prev) =>
      reorderedVideos.map((video, index) => ({
        ...video,
        order: index,
      })),
    );
  };

  const handleVideoDelete = (videoId: string) => {
    setCourseVideos(courseVideos.filter((v) => v.id !== videoId));
  };

  const handleVideoUpdate = (videoId: string, data: VideoFormData) => {
    setCourseVideos(
      courseVideos.map((video) =>
        video.id === videoId ? { ...video, ...data } : video,
      ),
    );
  };

  const getCurrentVideo = () => {
    if (uploadProgress) {
      return {
        title: uploadProgress.file.name.replace(/\.[^/.]+$/, ""),
        description: "",
        thumbnail: "",
      };
    }

    const lastVideo = courseVideos[courseVideos.length - 1];
    if (lastVideo) {
      return {
        title: lastVideo.title,
        description: lastVideo.description,
        thumbnail: lastVideo.thumbnail || "",
      };
    }

    return {
      title: "",
      description: "",
      thumbnail: "",
    };
  };

  const getCurrentVideoUrl = () => {
    if (uploadProgress) return uploadProgress.url;
    const lastVideo = courseVideos[courseVideos.length - 1];
    return lastVideo?.url || "";
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="author_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course_credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="wall_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Wall Image</FormLabel>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleWallImageUpload}
                      className="hidden"
                      id="wall-image-upload"
                      disabled={isSubmitting || uploadingWallImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("wall-image-upload")?.click()
                      }
                      disabled={isSubmitting || uploadingWallImage}
                      className="w-full"
                    >
                      {uploadingWallImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Wall Image
                        </>
                      )}
                    </Button>
                  </div>

                  {field.value && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <img
                        src={field.value}
                        alt="Course wall image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Videos</h3>
            </div>

            {/* Video Upload/YouTube URL Tabs */}
            <Tabs
              value={videoAddType}
              onValueChange={(v) => setVideoAddType(v as "upload" | "youtube")}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="upload">Upload Video</TabsTrigger>
                <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("video-upload")?.click()
                    }
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Video File
                      </>
                    )}
                  </Button>
                </div>

                {uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{uploadProgress.file.name}</span>
                      <span>{uploadProgress.progress}%</span>
                    </div>
                    <Progress value={uploadProgress.progress} className="h-2" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="youtube" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={addingYoutube}
                  />
                  <Button
                    type="button"
                    onClick={handleYouTubeAdd}
                    disabled={addingYoutube || !youtubeUrl.trim()}
                  >
                    {addingYoutube ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add YouTube Video
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter a YouTube URL to add it as a course video. The video
                  will be embedded directly without uploading to storage.
                </p>
              </TabsContent>
            </Tabs>

            <VideoList
              videos={courseVideos}
              onReorder={handleVideoReorder}
              onDelete={handleVideoDelete}
              onUpdateVideo={handleVideoUpdate}
            />
          </div>

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
                "Update Course"
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showVideoForm} onOpenChange={setShowVideoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Video Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <VideoForm
              defaultValues={getCurrentVideo()}
              videoUrl={getCurrentVideoUrl()}
              onSubmit={handleVideoFormSubmit}
              onCancel={() => setShowVideoForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
