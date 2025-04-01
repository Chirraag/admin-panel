import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@/types/category";
import { MoreHorizontal, FileText, Link, ListTree, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-2">
          {category.category_icon && (
            <span className="material-symbols-outlined">
              {category.category_icon}
            </span>
          )}
          <span>{category.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => category.onManageGoals?.(category)}
          >
            <Target className="h-4 w-4 mr-2" />
            Goals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => category.onManageSaleTypes?.(category)}
          >
            <ListTree className="h-4 w-4 mr-2" />
            Sale Types
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => category.onEdit?.(category)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => category.onDelete?.(category)}
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