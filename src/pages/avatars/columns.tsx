import { ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/types/avatar";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar as AvatarUI, AvatarImage } from "@/components/ui/avatar";

export const columns: ColumnDef<Avatar>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const avatar = row.original;
      return (
        <div className="flex items-center gap-2">
          <AvatarUI className="h-8 w-8">
            <AvatarImage src={avatar.image_url} alt={avatar.name} />
          </AvatarUI>
          <span>{avatar.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "ambient_sound",
    header: "Ambient Sound",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const avatar = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => avatar.onEdit?.(avatar)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => avatar.onDelete?.(avatar)}
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