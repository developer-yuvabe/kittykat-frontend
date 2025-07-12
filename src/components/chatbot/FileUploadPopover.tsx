import { useUserStore } from "@/store/user.store";
import { Image } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

type FileTriggerType = "image" | "file";

export function FileUploadPopover({
  isFileUploading,
  handleAddFiles,
}: {
  isFileUploading: boolean;
  handleAddFiles: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUserStore();

  const [acceptType, setAcceptType] = useState<string>("");

  const triggerInput = (type: FileTriggerType) => {
    const accept = type === "image" ? "image/*" : ".pdf";
    setAcceptType(accept);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const disabled = isFileUploading || !user?.thread_id;

  return (
    <>
      <button disabled={disabled} onClick={() => triggerInput("image")}>
        <Image size={20} className="text-primary cursor-pointer" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptType}
        className="hidden"
        onChange={handleAddFiles}
        multiple
        disabled={isFileUploading}
      />
    </>
  );
}
