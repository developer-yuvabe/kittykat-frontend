"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTeams } from "@/hooks/useTeams";
import { TeamResponse } from "@/types/team.types";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TeamDeleteDialogProps {
  team: TeamResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamDeleteDialog({
  team,
  open,
  onOpenChange,
}: TeamDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteTeam } = useTeams();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteTeam(team.id);
      toast.success(`Team "${team.name}" deleted successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete team");
      console.error("Error deleting team:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Team
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the team{" "}
            <strong>&quot;{team.name}&quot;</strong>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm">
              <strong>Team ID:</strong> {team.id}
            </p>
            <p className="text-sm">
              <strong>Members:</strong> {team.members.length}
            </p>
            <p className="text-sm">
              <strong>Credits:</strong> {team.credits.toLocaleString()}
            </p>
            <p className="text-sm">
              <strong>Tokens:</strong> {team.tokens.toLocaleString()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
