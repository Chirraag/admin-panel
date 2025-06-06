import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Import } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CourseImportTabProps {
  onImport: (course: Course) => void;
}

export function CourseImportTab({ onImport }: CourseImportTabProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          course_id: doc.id,
          ...doc.data(),
        })) as Course[];

        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter courses when search changes
  useEffect(() => {
    let filtered = courses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.author_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";

    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM dd, yyyy");
      }
      if (date instanceof Date) {
        return format(date, "MMM dd, yyyy");
      }
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No courses found</p>
          <p className="text-sm text-gray-400 mt-2">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {course.wall_image && (
                      <img
                        src={course.wall_image}
                        alt={course.title}
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">
                          By {course.author_name}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {course.videos?.length || 0} videos
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(course.created_at)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline">
                          {course.course_credits || 0} credits
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImport(course)}
                    className="flex items-center gap-2 ml-4"
                  >
                    <Import className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
