// 3. MediaUploadActions (upload buttons and URL dialog)
import React, { useState } from "react";
import { Upload, Loader2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MediaUploadActionsProps {
  isDisabled: boolean;
  isUploading: boolean;
  onUrlUpload: (urls: string[]) => void;
  isUrlDialogOpen: boolean;
  setIsUrlDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MediaUploadActions({
  isDisabled,
  isUploading,
  onUrlUpload,
  isUrlDialogOpen,
  setIsUrlDialogOpen,
}: MediaUploadActionsProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    const urls = urlInput
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length > 0) {
      onUrlUpload(urls);
      setUrlInput("");
      setIsUrlDialogOpen(false);
    }
  };

  return (
    <div className="flex gap-x-3">
      <Button
        variant="outline"
        className="bg-[#636AE8] hover:bg-[#636AE8] hover:text-white text-white mb-2"
        disabled={isDisabled}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {isUploading ? "Uploading..." : "Upload Files"}
      </Button>

      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className="mb-2 border-[#636AE8] text-[#636AE8] hover:bg-[#636AE8] hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Link className="mr-2 h-4 w-4" />
            Add URLs
          </Button>
        </DialogTrigger>

        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Add Media URLs</DialogTitle>
          </DialogHeader>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={`Enter media URLs (one per line)\nhttps://example.com/image1.jpg\nhttps://example.com/video1.mp4`}
            className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
            rows={3}
            disabled={isUploading}
          />
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsUrlDialogOpen(false);
                setUrlInput("");
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUrlSubmit();
              }}
              disabled={!urlInput.trim() || isUploading}
              className="bg-[#636AE8] hover:bg-[#5A61D9] text-white"
            >
              Add URLs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
