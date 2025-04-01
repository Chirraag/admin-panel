import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseFormData, Video } from '@/types/course';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseForm } from './course-form';
import { toast } from 'sonner';
import { deleteVideo } from '@/lib/s3';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        course_id: doc.id,
        ...doc.data(),
        onEdit: (course: Course) => {
          setEditingCourse(course);
          setShowForm(true);
        },
        onDelete: (course: Course) => setCourseToDelete(course),
      } as Course));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (data: CourseFormData, videos: Video[]) => {
    try {
      const timestamp = serverTimestamp();
      const docRef = await addDoc(collection(db, 'courses'), {
        ...data,
        videos,
        created_at: timestamp,
        updated_at: timestamp,
      });

      // Update the document with its own ID
      await updateDoc(doc(db, 'courses', docRef.id), {
        course_id: docRef.id
      });

      toast.success('Course created successfully');
      setShowForm(false);
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleUpdate = async (data: CourseFormData, videos: Video[]) => {
    if (!editingCourse) return;
    try {
      // Only delete videos that were explicitly removed
      const removedVideos = editingCourse.videos.filter(oldVideo => 
        !videos.some(newVideo => newVideo.id === oldVideo.id)
      );

      // Delete removed videos from S3
      for (const video of removedVideos) {
        await deleteVideo(video.url);
      }

      // Update the course with new data and videos
      await updateDoc(doc(db, 'courses', editingCourse.id), {
        ...data,
        videos,
        updated_at: serverTimestamp(),
      });
      
      toast.success('Course updated successfully');
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      // Delete all videos from S3
      const deletePromises = courseToDelete.videos.map(video => deleteVideo(video.url));
      await Promise.all(deletePromises);

      // Delete course from Firebase
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      
      toast.success('Course and all videos deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <DataTable columns={columns} data={courses} />

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] p-0">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'Edit Course' : 'Create Course'}
                </DialogTitle>
              </DialogHeader>
              <CourseForm
                initialData={editingCourse || undefined}
                videos={editingCourse?.videos || []}
                onSubmit={editingCourse ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!courseToDelete} onOpenChange={() => !isDeleting && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and all its videos from both the database and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}