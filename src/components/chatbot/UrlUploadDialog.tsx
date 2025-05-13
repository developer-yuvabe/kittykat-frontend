import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { brandService } from "@/services/api/brand.service";

interface FileUploaderProps {
  prefix: string | null;
  onUploadComplete: (url: string) => void;
}

export default function FileUploader({
  prefix,
  onUploadComplete,
}: FileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    return interval;
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const progressInterval = simulateProgress();

    try {
      const url = await brandService.uploadFileAndReturnUrl(
        prefix as string,
        file.name,
        file.type,
        file
      );
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        onUploadComplete(url);
        setUploading(false);
        setIsOpen(false);
        toast.success("File uploaded successfully!", {
          position: "top-right",
        });
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      setUploading(false);
      toast.error("Upload failed. Please try again.");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    multiple: false,
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !uploading && setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-primary" size="icon">
          <Upload size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-medium">
            Upload File
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-3">
              <Upload className="h-10 w-10 text-primary" />
              <p className="text-sm text-gray-600">
                Drag and drop your file here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                Any file type is supported
              </p>
            </div>
          </div>
          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
