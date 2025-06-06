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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* SVG Icon */}
            {category.image_url && (
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src={category.image_url}
                  alt={`${category.name} icon`}
                  className="w-6 h-6"
                />
              </div>
            )}
            {/* Material Icon (fallback) */}
            {category.category_icon && !category.image_url && (
              <span className="material-symbols-outlined text-xl">
                {category.category_icon}
              </span>
            )}
          </div>
          <span className="font-medium">{category.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
      );
    },
  },
  {
    id: "stats",
    header: "Content",
    cell: ({ row }) => {
      const category = row.original;
      const goalCount = category.goals?.length || 0;
      const saleTypeCount = category.sale_types?.length || 0;
      const knowledgeBaseCount = category.knowledge_base?.length || 0;

      return (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{goalCount} Goals</span>
          <span>{saleTypeCount} Sale Types</span>
          <span>{knowledgeBaseCount} Files</span>
        </div>
      );
    },
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
