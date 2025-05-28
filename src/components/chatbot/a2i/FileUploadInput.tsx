import React, { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image } from "lucide-react";

interface FileUploadInputProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  accept?: string;
  label: string;
  description?: string;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  value,
  onChange,
  accept = "image/*",
  label,
  description,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      setIsUploading(true);
      try {
        // This would be imported from your service
        // const url = await uploadFileAndReturnUrl(file);
        // For now, create a mock URL
        const url = URL.createObjectURL(file);
        onChange(url);
      } catch (error) {
        console.error("File upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0]);
      }
    },
    [handleFileUpload]
  );

  const clearFile = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
            <Image className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Image uploaded</p>
              <p className="text-xs text-muted-foreground">
                Ready to use as reference
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-1 hover:bg-background rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {isUploading
                ? "Uploading..."
                : "Drop your image here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WebP formats
            </p>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
              <Badge variant="secondary">Uploading...</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
