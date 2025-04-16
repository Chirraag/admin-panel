import { ColumnDef } from "@tanstack/react-table";
import { TeamDocument } from "@/types/team";
import { MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export const columns: ColumnDef<TeamDocument>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const team = row.original;
      return (
        <div
          className="flex items-center gap-4 cursor-pointer hover:text-blue-600"
          onClick={() => team.onView?.(team)}
        >
          {team.logo_url && (
            <img
              src={team.logo_url}
              alt={team.name}
              className="h-8 w-8 object-contain rounded"
            />
          )}
          <span>{team.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "team_leader_email",
    header: "Team Leader",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "team_code",
    header: "Team Code",
    cell: ({ row }) => {
      const code = row.getValue("team_code") as string;
      return (
        <Badge variant="outline" className="font-mono">
          {code}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as Date;
      return date ? format(date.toDate(), "MMM dd, yyyy") : "N/A";
    },
  },
  {
    accessorKey: "challenges_loaded",
    header: "Status",
    cell: ({ row }) => {
      const team = row.original;
      if (team.is_loading_challenges) {
        return <Badge variant="secondary">Loading Challenges...</Badge>;
      }
      return team.challenges_loaded ? (
        <Badge variant="default">Ready</Badge>
      ) : (
        <Badge variant="outline">Pending</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const team = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => team.onManageMembers?.(team)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Members
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => team.onView?.(team)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => team.onEdit?.(team)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => team.onDelete?.(team)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
