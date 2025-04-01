import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video } from '@/types/course';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Play, Edit } from 'lucide-react';

interface SortableVideoProps {
  video: Video;
  onDelete: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function SortableVideo({ video, onDelete, onEdit, disabled }: SortableVideoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60); // Using floor instead of round
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          {video.thumbnail && (
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="h-16 w-24 object-cover rounded"
            />
          )}
          <div>
            <h4 className="font-medium">{video.title}</h4>
            <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
            {video.video_duration && (
              <p className="text-sm text-gray-500 mt-1">
                Duration: {formatDuration(video.video_duration)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => window.open(video.url, '_blank')}
          disabled={disabled}
        >
          <Play className="h-4 w-4" />
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