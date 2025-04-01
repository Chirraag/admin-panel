import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user";
import { FileText, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "user_credits",
    header: "Credits",
    cell: ({ row }) => {
      const credits = row.getValue("user_credits") as number;
      return credits !== undefined ? credits : 'N/A';
    },
  },
  {
    accessorKey: "is_credits_locked",
    header: "Credits Locked",
    cell: ({ row }) => {
      const isLocked = row.getValue("is_credits_locked") as boolean;
      return isLocked !== undefined ? (
        <Badge variant={isLocked ? "destructive" : "outline"}>
          {isLocked ? "Locked" : "Unlocked"}
        </Badge>
      ) : 'N/A';
    },
  },
  {
    accessorKey: "goal",
    header: "Goal",
  },
  {
    accessorKey: "salesType",
    header: "Sales Type",
  },
  {
    accessorKey: "struggle",
    header: "Struggle",
  },
  {
    accessorKey: "needHelpWith",
    header: "Needs Help With",
  },
  {
    accessorKey: "createdTime",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdTime") as Date;
      return date?.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      const isAdmin = user.role === 'admin';

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => user.onViewSubmissions?.(user)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Submissions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => user.onEdit?.(user)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => user.onDelete?.(user)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }
  }
]