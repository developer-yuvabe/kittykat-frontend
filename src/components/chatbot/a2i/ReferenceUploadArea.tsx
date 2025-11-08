import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface ReferenceUploadAreaProps {
  fileTypes: string[];
  maxFileSizeLimit: number;
  remainingSlots: number;
  isUploading: boolean;
  onDrop: (acceptedFiles: File[]) => void;
  onOpenMediaLibrary: () => void;
  compact?: boolean; // New prop for compact single-column mode
}

export const ReferenceUploadArea = ({
  fileTypes,
  maxFileSizeLimit,
  remainingSlots,
  isUploading,
  onDrop,
  onOpenMediaLibrary,
  compact = false,
}: ReferenceUploadAreaProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: Object.fromEntries(fileTypes.map((type) => [type, []])),
    disabled: isUploading || remainingSlots <= 0,
    maxFiles: remainingSlots,
    maxSize: maxFileSizeLimit * 1024 * 1024,
  });

  return (
    <div
      className={
        compact
          ? "w-full"
          : "w-[320px] border-r bg-muted/5 p-5 flex flex-col justify-center"
      }
    >
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl cursor-pointer transition-all bg-background hover:bg-muted/20",
          compact
            ? "p-4 min-h-[100px] flex items-center"
            : "p-8 min-h-[400px] flex flex-col items-center justify-center text-center",
          isDragActive && "border-primary bg-primary/10",
          (isUploading || remainingSlots <= 0) && "opacity-50"
        )}
      >
        <input {...getInputProps()} />
        {compact ? (
          // Compact mode: horizontal layout with icon on left
          <div className="flex items-center gap-4 w-full">
            <Upload className="h-10 w-10 text-muted-foreground flex-shrink-0 ml-10" />
            <div className="flex-1 space-y-2">
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">Drop files here</p>
                <p className="text-xs text-muted-foreground">
                  Supported format: PNG, JPG & WEBP
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                <span className="text-primary underline cursor-pointer font-medium">
                  Browse files on device
                </span>
                <span className="text-muted-foreground">or</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onOpenMediaLibrary();
                  }}
                  type="button"
                  className="text-primary underline cursor-pointer font-medium hover:text-primary/80"
                >
                  Select from Gallery
                </button>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {remainingSlots > 0
                    ? `${remainingSlots} slot${
                        remainingSlots > 1 ? "s" : ""
                      } left`
                    : "Limit reached"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Dual mode: vertical centered layout
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-semibold text-base">Drop files here</p>
              <p className="text-xs text-muted-foreground">
                Supported format: PNG, JPG & WEBP
              </p>
              <p className="text-sm text-primary mt-3 underline cursor-pointer font-medium">
                Browse files on device
              </p>
            </div>

            <div className="flex items-center w-full my-2">
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

            <p className="text-xs text-muted-foreground mt-4">
              {remainingSlots > 0
                ? `You can add ${remainingSlots} more image${
                    remainingSlots > 1 ? "s" : ""
                  }`
                : "Maximum upload limit reached"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
