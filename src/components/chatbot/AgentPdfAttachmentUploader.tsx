import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, PaperclipIcon } from "lucide-react";
import { MAX_PDF_UPLOAD_SIZE } from "@/lib/constants";

interface AgentPdfAttachmentUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function AgentPdfAttachmentUploader({
  onUploadComplete,
}: AgentPdfAttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "threads",
        file
      );
      onUploadComplete(url);
      toast.success("File uploaded successfully!", {
        position: "top-right",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.warning("Only PDF files are allowed.");
      return;
    }

    // Validate file size (MAX_PDF_UPLOAD_SIZE is in bytes)
    if (file.size > MAX_PDF_UPLOAD_SIZE) {
      const maxSizeMB = MAX_PDF_UPLOAD_SIZE / (1024 * 1024);
      toast.warning(`File size must be ≤ ${maxSizeMB}MB.`);
      return;
    }

    uploadFile(file);
  };

  return (
    <>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : (
        <PaperclipIcon
          size={20}
          className="text-primary cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        />
      )}
    </>
  );
}
