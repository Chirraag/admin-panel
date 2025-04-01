import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Video, VideoFormData } from '@/types/course';
import { SortableVideo } from './sortable-video';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { VideoForm } from './video-form';
import { deleteVideo } from '@/lib/s3';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoListProps {
  videos: Video[];
  onReorder: (videos: Video[]) => void;
  onDelete: (videoId: string) => void;
  onUpdateVideo: (videoId: string, data: VideoFormData) => void;
}

export function VideoList({ videos, onReorder, onDelete, onUpdateVideo }: VideoListProps) {
  const [items, setItems] = useState(videos);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setItems(videos);
  }, [videos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));

      setItems(newItems);
      onReorder(newItems);
    }
  };

  const handleVideoUpdate = async (data: VideoFormData) => {
    if (!editingVideo) return;
    
    setIsUpdating(true);
    try {
      onUpdateVideo(editingVideo.id, data);
      setShowDialog(false);
      setEditingVideo(null);
      toast.success('Video details updated');
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVideoDelete = async (video: Video) => {
    setIsDeleting(true);
    try {
      await deleteVideo(video.url);
      if (video.thumbnail) {
        await deleteVideo(video.thumbnail);
      }
      onDelete(video.id);
      toast.success('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (video: Video) => {
    setEditingVideo(video);
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    if (isUpdating) return;
    setShowDialog(false);
    setEditingVideo(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((video) => (
              <SortableVideo
                key={video.id}
                video={video}
                onDelete={() => handleVideoDelete(video)}
                onEdit={() => handleEditClick(video)}
                disabled={isDeleting}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <ScrollArea className="max-h-[calc(85vh-4rem)]">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>Edit Video</DialogTitle>
                <DialogDescription>
                  Update the video title, description, and thumbnail. Changes will be saved when you click Save.
                </DialogDescription>
              </DialogHeader>
              {editingVideo && (
                <VideoForm
                  defaultValues={{
                    title: editingVideo.title,
                    description: editingVideo.description,
                    thumbnail: editingVideo.thumbnail,
                  }}
                  videoUrl={editingVideo.url}
                  onSubmit={handleVideoUpdate}
                  onCancel={handleDialogClose}
                  isSubmitting={isUpdating}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}