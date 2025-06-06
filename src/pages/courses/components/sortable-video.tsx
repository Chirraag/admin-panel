import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Video } from "@/types/course";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Trash2,
  Play,
  Edit,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SortableVideoProps {
  video: Video;
  onDelete: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function SortableVideo({
  video,
  onDelete,
  onEdit,
  disabled,
}: SortableVideoProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const isYouTubeUrl = (url: string) => {
    return url && (url.includes("youtube.com") || url.includes("youtu.be"));
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      let videoId = "";

      if (url.includes("youtube.com/watch?v=")) {
        videoId = new URL(url).searchParams.get("v") || "";
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (error) {
      console.error("Error creating YouTube embed URL:", error);
    }
    return url;
  };

  const handleVideoClick = () => {
    if (isYouTubeUrl(video.url)) {
      // For YouTube videos, open in new tab
      window.open(video.url, "_blank");
    } else {
      // For uploaded videos, open direct link
      window.open(video.url, "_blank");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-gray-600"
        disabled={disabled}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-4">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-16 w-24 object-cover rounded"
            />
          ) : (
            // Fallback placeholder for videos without thumbnails
            <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
              {isYouTubeUrl(video.url) ? (
                <Youtube className="h-8 w-8 text-red-500" />
              ) : (
                <Play className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{video.title}</h4>
              {isYouTubeUrl(video.url) && (
                <Badge variant="outline" className="text-xs">
                  <Youtube className="h-3 w-3 mr-1" />
                  YouTube
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mb-1">
              {video.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              {video.video_duration > 0 && (
                <span>Duration: {formatDuration(video.video_duration)}</span>
              )}
              {isYouTubeUrl(video.url) && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  External Video
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleVideoClick}
          disabled={disabled}
          title={isYouTubeUrl(video.url) ? "Open on YouTube" : "Play video"}
        >
          {isYouTubeUrl(video.url) ? (
            <ExternalLink className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={disabled}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
