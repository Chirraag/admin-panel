import { ColumnDef } from "@tanstack/react-table";
import { Challenge } from "@/types/challenge";
import { MoreHorizontal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<Challenge>[] = [
  {
    accessorKey: "title",
    header: "Title",
    sortable: true,
  },
  {
    accessorKey: "type",
    header: "Type",
    sortable: true,
  },
  {
    accessorKey: "duration",
    header: "Duration (sec)",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      return duration || 'N/A';
    },
    enableSorting: false,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as { name: string } | undefined;
      return category?.name || 'Uncategorized';
    },
    enableSorting: false,
  },
  {
    accessorKey: "credits",
    header: "Credits",
    cell: ({ row }) => {
      const credits = row.getValue("credits") as number;
      return credits;
    },
    enableSorting: false,
  },
  {
    accessorKey: "features",
    header: "Features",
    cell: ({ row }) => {
      const features = row.getValue("features") as string[];
      if (!features?.length) return null;
      
      return (
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 2).map((feature, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
          {features.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{features.length - 2} more
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "product_name",
    header: "Product",
    sortable: true,
  },
  {
    accessorKey: "isFree",
    header: "Access",
    cell: ({ row }) => {
      const isFree = row.getValue("isFree") as boolean;
      return (
        <Badge variant={isFree ? "secondary" : "default"}>
          {isFree ? "Free" : "Premium"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const challenge = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => challenge.onTest?.(challenge)}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Test Challenge
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => challenge.onEdit?.(challenge)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => challenge.onDelete?.(challenge)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  },
];