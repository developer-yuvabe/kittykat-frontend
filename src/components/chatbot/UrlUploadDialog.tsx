import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CgAttachment } from "react-icons/cg";

import { Loader2 } from "lucide-react"; // Loader icon

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
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
    if (file) {
      uploadFile(file);
    }
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
        <CgAttachment
          size={20}
          className="text-primary cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        />
      )}
    </>
  );
}
