import { Timestamp } from 'firebase/firestore';

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  order: number;
  video_duration: number;
  thumbnail: string;
  created_at: Timestamp;
}

export interface Course {
  id: string;
  course_id: string;
  title: string;
  description: string;
  author_name: string;
  wall_image: string;
  course_credits: number;
  videos: Video[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CourseFormData = Omit<Course, 'id' | 'doc_id' | 'created_at' | 'updated_at' | 'videos'>;

export interface VideoFormData {
  title: string;
  description: string;
  thumbnail: string;
}