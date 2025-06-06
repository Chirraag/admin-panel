import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Goal } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalForm } from "./goal-form";
import { deleteStorageImage } from "@/lib/firebase-storage";

interface GoalsDialogProps {
  categoryId: string;
  goals: Goal[];
  onClose: () => void;
  onUpdate: () => void;
}

export function GoalsDialog({
  categoryId,
  goals,
  onClose,
  onUpdate,
}: GoalsDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleCreate = async (data: Omit<Goal, "id">) => {
    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        ...data,
      };

      await updateDoc(doc(db, "categories", categoryId), {
        goals: [...goals, newGoal],
      });

      toast.success("Goal created successfully");
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const handleUpdate = async (data: Omit<Goal, "id">) => {
    if (!editingGoal) return;
    try {
      const updatedGoals = goals.map((goal) =>
        goal.id === editingGoal.id ? { ...goal, ...data } : goal,
      );

      await updateDoc(doc(db, "categories", categoryId), {
        goals: updatedGoals,
      });

      toast.success("Goal updated successfully");
      setShowForm(false);
      setEditingGoal(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;
    try {
      // Delete the SVG image from storage if it exists
      if (goalToDelete.image_url) {
        try {
          await deleteStorageImage(goalToDelete.image_url);
        } catch (error) {
          console.error("Error deleting goal SVG image:", error);
          // Continue with goal deletion even if image deletion fails
        }
      }

      const updatedGoals = goals.filter((goal) => goal.id !== goalToDelete.id);

      await updateDoc(doc(db, "categories", categoryId), {
        goals: updatedGoals,
      });

      toast.success("Goal deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Goals</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>

          <div className="grid gap-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-start gap-4 p-4 rounded-lg border"
              >
                {goal.image_url && (
                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={goal.image_url}
                      alt={goal.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{goal.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {goal.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setGoalToDelete(goal)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {goals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No goals added yet. Click "Add Goal" to create your first goal.
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingGoal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "Create Goal"}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            categoryId={categoryId}
            initialData={editingGoal || undefined}
            onSubmit={editingGoal ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!goalToDelete}
        onOpenChange={() => setGoalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              goal and its associated SVG image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
