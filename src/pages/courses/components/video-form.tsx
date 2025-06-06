import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useRef, useEffect } from "react";
import { VideoFormData } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Youtube } from "lucide-react";
import { uploadVideo } from "@/lib/s3";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const videoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnail: z.string().optional(),
});

interface VideoFormProps {
  defaultValues?: VideoFormData;
  videoUrl?: string;
  onSubmit: (data: VideoFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function VideoForm({
  defaultValues,
  videoUrl,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VideoFormProps) {
  const [thumbnailType, setThumbnailType] = useState<"frame" | "upload">(
    "upload",
  );
  const [selectedTime, setSelectedTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [skipVideoPreview, setSkipVideoPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      ...defaultValues,
    },
  });

  // Check if the URL is a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return url && (url.includes("youtube.com") || url.includes("youtu.be"));
  };

  const getYouTubeThumbnail = (url: string) => {
    try {
      let videoId = "";

      if (url.includes("youtube.com/watch?v=")) {
        videoId = new URL(url).searchParams.get("v") || "";
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      }

      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } catch (error) {
      console.error("Error extracting YouTube thumbnail:", error);
    }
    return "";
  };

  useEffect(() => {
    // If it's a YouTube URL, set default thumbnail and skip video preview
    if (videoUrl && isYouTubeUrl(videoUrl)) {
      setSkipVideoPreview(true);
      setThumbnailType("upload");

      // Auto-set YouTube thumbnail if no thumbnail is already set
      if (!form.getValues("thumbnail")) {
        const youtubeThumbnail = getYouTubeThumbnail(videoUrl);
        if (youtubeThumbnail) {
          form.setValue("thumbnail", youtubeThumbnail);
        }
      }
      return;
    }

    // Regular video loading logic for uploaded files
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    let mounted = true;

    const handleLoadedMetadata = () => {
      if (!mounted) return;
      setDuration(video.duration);
      setIsVideoLoaded(true);
      setVideoError(null);
      setSkipVideoPreview(false);
      video.currentTime = 0;
    };

    const handleTimeUpdate = () => {
      if (!mounted) return;
      setSelectedTime(video.currentTime);
    };

    const handleError = (e: any) => {
      if (!mounted) return;
      console.error("Video loading error:", e);
      setVideoError(
        "Video preview unavailable. You can still upload a custom thumbnail.",
      );
      setIsVideoLoaded(false);
      setSkipVideoPreview(true);
    };

    const handleCanPlay = () => {
      if (!mounted) return;
      setVideoError(null);
      setIsVideoLoaded(true);
    };

    // Reset states
    setIsVideoLoaded(false);
    setVideoError(null);
    setSelectedTime(0);
    setDuration(0);
    setSkipVideoPreview(false);

    // Add event listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);

    // Set video properties and load
    video.crossOrigin = "anonymous";
    video.preload = "metadata";

    const loadTimeout = setTimeout(() => {
      if (!isVideoLoaded && mounted) {
        handleError("Timeout loading video");
      }
    }, 10000);

    video.src = videoUrl;

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      if (video) {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("error", handleError);
        video.removeEventListener("canplay", handleCanPlay);
        video.src = "";
        video.load();
      }
    };
  }, [videoUrl]);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setUploadingThumbnail(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob(resolve, "image/jpeg", 0.95);
        } catch (e) {
          console.error("Canvas toBlob error:", e);
          resolve(null);
        }
      });

      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      const file = new File([blob], `thumbnail-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const url = await uploadVideo(file);

      form.setValue("thumbnail", url);
      toast.success("Frame captured successfully");
    } catch (error) {
      console.error("Error capturing frame:", error);
      toast.error("Failed to capture frame");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadVideo(file);
      form.setValue("thumbnail", url);
      toast.success("Thumbnail uploaded successfully");
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
      event.target.value = "";
    }
  };

  const handleTimeChange = (value: number[]) => {
    const time = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setSelectedTime(time);
    }
  };

  const handleSubmit = () => {
    form.handleSubmit(onSubmit)();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSkipPreview = () => {
    setSkipVideoPreview(true);
    setVideoError(null);
    setThumbnailType("upload");
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
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
                  <Textarea {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>

                {/* Show different UI based on video type */}
                {isYouTubeUrl(videoUrl || "") ? (
                  // YouTube URL - Show YouTube thumbnail option and upload
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Youtube className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-700">
                        YouTube Video - Thumbnail will be auto-generated or you
                        can upload a custom one
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="thumbnail-upload"
                        disabled={isSubmitting || uploadingThumbnail}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("thumbnail-upload")?.click()
                        }
                        disabled={isSubmitting || uploadingThumbnail}
                        className="w-full"
                      >
                        {uploadingThumbnail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Custom Thumbnail
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Regular uploaded video - Show tabs for frame capture vs upload
                  <Tabs
                    value={thumbnailType}
                    onValueChange={(v) =>
                      setThumbnailType(v as "frame" | "upload")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="frame">Video Frame</TabsTrigger>
                      <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    </TabsList>

                    <TabsContent value="frame" className="space-y-4">
                      {!skipVideoPreview ? (
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          {videoError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-500/10 p-4">
                              <p className="text-center mb-4">{videoError}</p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => window.location.reload()}
                                  size="sm"
                                >
                                  Retry
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleSkipPreview}
                                  size="sm"
                                >
                                  Skip Preview
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <video
                              ref={videoRef}
                              playsInline
                              preload="metadata"
                              crossOrigin="anonymous"
                              className="w-full h-full"
                              style={{ objectFit: "contain" }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">
                            Video preview skipped. Upload a custom thumbnail
                            below.
                          </p>
                        </div>
                      )}

                      {isVideoLoaded && !videoError && !skipVideoPreview && (
                        <div className="space-y-4">
                          <div className="px-2">
                            <Slider
                              value={[selectedTime]}
                              min={0}
                              max={duration}
                              step={0.1}
                              onValueChange={handleTimeChange}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{formatTime(selectedTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                          <Button
                            type="button"
                            onClick={captureFrame}
                            disabled={
                              isSubmitting ||
                              uploadingThumbnail ||
                              !isVideoLoaded
                            }
                            className="w-full"
                          >
                            {uploadingThumbnail ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Capturing...
                              </>
                            ) : (
                              "Use Current Frame as Thumbnail"
                            )}
                          </Button>
                        </div>
                      )}

                      {(videoError || skipVideoPreview) && (
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            Can't generate thumbnail from video? Upload a custom
                            image instead.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setThumbnailType("upload")}
                          >
                            Upload Custom Thumbnail
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="thumbnail-upload"
                          disabled={isSubmitting || uploadingThumbnail}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("thumbnail-upload")?.click()
                          }
                          disabled={isSubmitting || uploadingThumbnail}
                          className="w-full"
                        >
                          {uploadingThumbnail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {field.value && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Current Thumbnail
                    </p>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <img
                        src={field.value}
                        alt="Thumbnail preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingThumbnail}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
