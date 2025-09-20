import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";

interface AskKittykartRejectDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  rejectReason: string;
  attachedFiles: File[];
  onClose: () => void;
  onRejectReasonChange: (reason: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
}

export function AskKittykartRejectDialog({
  isOpen,
  isSubmitting,
  rejectReason,
  attachedFiles,
  onClose,
  onRejectReasonChange,
  onFileUpload,
  onRemoveFile,
  onSubmit,
}: AskKittykartRejectDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <DialogTitle>Provide Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing what needs to be corrected. Your feedback
            helps us deliver quality images that meet your expectations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              What would you like us to improve?
            </label>
            <Textarea
              placeholder="Please describe what needs to be changed or improved..."
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              className="min-h-[100px] max-w-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Attach reference files (optional)
            </label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFileUpload}
                accept="image/*,.pdf,.doc,.docx"
              />

              {attachedFiles.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs"
                    >
                      <span className="truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!rejectReason.trim() || isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
