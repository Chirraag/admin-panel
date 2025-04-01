import { ColumnDef } from "@tanstack/react-table";
import { Course } from "@/types/course";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex items-center gap-4">
          {course.wall_image && (
            <img 
              src={course.wall_image} 
              alt={course.title} 
              className="h-12 w-20 object-cover rounded"
            />
          )}
          <span>{course.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "author_name",
    header: "Author",
  },
  {
    accessorKey: "videos",
    header: "Videos",
    cell: ({ row }) => {
      const videos = row.getValue("videos") as Course["videos"];
      return videos?.length || 0;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as Date;
      return date ? format(date.toDate(), 'MMM dd, yyyy') : 'N/A';
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => course.onEdit?.(course)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => course.onDelete?.(course)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];