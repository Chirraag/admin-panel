import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';
import { VideoFormData } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { uploadVideo } from '@/lib/s3';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  thumbnail: z.string().optional(),
});

interface VideoFormProps {
  defaultValues?: VideoFormData;
  videoUrl?: string;
  onSubmit: (data: VideoFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function VideoForm({ defaultValues, videoUrl, onSubmit, onCancel, isSubmitting = false }: VideoFormProps) {
  const [thumbnailType, setThumbnailType] = useState<'frame' | 'upload'>('frame');
  const [selectedTime, setSelectedTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    let mounted = true;

    const handleLoadedMetadata = () => {
      if (!mounted) return;
      setDuration(video.duration);
      setIsVideoLoaded(true);
      setVideoError(null);
      // Set initial frame
      video.currentTime = 0;
    };

    const handleTimeUpdate = () => {
      if (!mounted) return;
      setSelectedTime(video.currentTime);
    };

    const handleError = () => {
      if (!mounted) return;
      console.error('Video loading error');
      setVideoError('Failed to load video. Please try again.');
      setIsVideoLoaded(false);
      toast.error('Failed to load video');
    };

    // Reset states
    setIsVideoLoaded(false);
    setVideoError(null);
    setSelectedTime(0);
    setDuration(0);

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // Set video properties and load
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;

    return () => {
      mounted = false;
      if (video) {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('error', handleError);
        video.src = '';
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

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        } catch (e) {
          console.error('Canvas toBlob error:', e);
          resolve(null);
        }
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Upload the blob as a file
      const file = new File([blob], `thumbnail-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = await uploadVideo(file);

      // Update form with new thumbnail URL
      form.setValue('thumbnail', url);
      toast.success('Frame captured successfully');
    } catch (error) {
      console.error('Error capturing frame:', error);
      toast.error('Failed to capture frame');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadVideo(file);
      form.setValue('thumbnail', url);
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
      event.target.value = '';
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                <Tabs value={thumbnailType} onValueChange={(v) => setThumbnailType(v as 'frame' | 'upload')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="frame">Video Frame</TabsTrigger>
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  </TabsList>

                  <TabsContent value="frame" className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      {videoError ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white bg-red-500/10">
                          <p>{videoError}</p>
                        </div>
                      ) : (
                        <video
                          ref={videoRef}
                          playsInline
                          preload="metadata"
                          crossOrigin="anonymous"
                          className="w-full h-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                    
                    {isVideoLoaded && !videoError && (
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
                          disabled={isSubmitting || uploadingThumbnail || !isVideoLoaded}
                          className="w-full"
                        >
                          {uploadingThumbnail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Capturing...
                            </>
                          ) : (
                            'Use Current Frame as Thumbnail'
                          )}
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
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
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

                {field.value && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current Thumbnail</p>
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
                'Save'
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}