import { ColumnDef } from "@tanstack/react-table";
import { Team } from "@/types/team";
import { MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const columns: ColumnDef<Team>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const team = row.original;
      return (
        <div className="flex items-center gap-4">
          {team.company_logo && (
            <img
              src={team.company_logo}
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "Approved"
              ? "default"
              : status === "Pending"
                ? "secondary"
                : "destructive"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "members",
    header: "Members",
    cell: ({ row }) => {
      const members = (row.getValue("members") as any[]) || [];
      return members.length;
    },
  },
  {
    accessorKey: "dateAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("dateAt") as Date;
      return date ? format(date.toDate(), "MMM dd, yyyy") : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const team = row.original;
      const status = team.status;

      if (status === "Pending") {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => team.onApprove?.(team)}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => team.onDecline?.(team)}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4 text-red-600" />
              Decline
            </Button>
          </div>
        );
      }

      if (status === "Approved") {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => team.onView?.(team)}
          >
            View Details
          </Button>
        );
      }

      return null;
    },
  },
];
