import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AskKittykartAcceptDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function AskKittykartAcceptDialog({
  isOpen,
  isSubmitting,
  onClose,
  onAccept,
}: AskKittykartAcceptDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve this image?</DialogTitle>
          <DialogDescription>
            By accepting, you give final approval for the image(s).
            <br />
            <strong>This action cannot be undone</strong>, and any changes
            requested afterwards may incur additional charges.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Back to Review
          </Button>
          <Button
            onClick={async () => {
              onAccept();
            }}
            disabled={isSubmitting}
            variant="default"
          >
            {isSubmitting ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
