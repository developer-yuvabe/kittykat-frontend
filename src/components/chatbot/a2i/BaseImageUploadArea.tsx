import { Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface BaseImageUploadAreaProps {
  fileTypes: string[];
  maxFileSizeLimit: number;
  isUploading: boolean;
  onDrop: (acceptedFile: File, e?: React.DragEvent) => void;
  onOpenMediaLibrary: () => void;
  baseImageUrl: string | null;
  setBaseImageUrl: (url: string | null) => void;
}

export const BaseImageUploadArea = ({
  fileTypes,
  maxFileSizeLimit,
  isUploading,
  onDrop,
  onOpenMediaLibrary,
  baseImageUrl,
  setBaseImageUrl,
}: BaseImageUploadAreaProps) => {
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false, // ⬅️ SINGLE FILE ONLY
    accept: Object.fromEntries(fileTypes.map((type) => [type, []])),
    disabled: isUploading,
    maxFiles: 1,
    maxSize: maxFileSizeLimit * 1024 * 1024,
    onDrop: (acceptedFiles, _fileRejections, event) => {
      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles[0], event as React.DragEvent); // ⬅️ Pass single file
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className="w-[320px] h-[300px] bg-muted/5 flex flex-col justify-center"
    >
      <input {...getInputProps()} />
      {/* 👉 IF IMAGE EXISTS SHOW PREVIEW */}
      {baseImageUrl ? (
        <div className="relative overflow-hidden bg-background p-2">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setBaseImageUrl(null);
            }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image */}
          <img
            src={baseImageUrl}
            alt="Base"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        /* 👉 ELSE SHOW DROPZONE UI */
        <div
          className={cn(
            "border-2 border-dashed rounded-xl cursor-pointer transition-all bg-background hover:bg-muted/20 p-8 min-h-[300px] flex flex-col items-center justify-center text-center",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <Upload className="h-12 w-12 text-muted-foreground" />

          <div className="space-y-2 mt-4">
            <p className="font-semibold text-base">Upload Base Image</p>
            <p className="text-xs text-muted-foreground">
              Supported: PNG, JPG, WEBP
            </p>

            <p className="text-sm text-primary mt-3 underline cursor-pointer font-medium">
              Browse files on device
            </p>
          </div>

          <div className="flex items-center w-full my-3">
            <div className="flex-grow" />
            <span className="px-3 text-xs text-muted-foreground uppercase font-medium">
              or
            </span>
            <div className="flex-grow" />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenMediaLibrary();
            }}
            type="button"
            className="text-sm text-primary underline cursor-pointer font-medium hover:text-primary/80"
          >
            Select from Gallery
          </button>
        </div>
      )}
    </div>
  );
};
