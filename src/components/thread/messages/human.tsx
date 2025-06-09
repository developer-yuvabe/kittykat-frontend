import React, { JSX, useEffect } from "react";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentString, removeKittyKatTags } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";
import { FilePreview } from "@/components/chatbot/FilePreview";
import {
  FileIcon,
  FileTextIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileVideoIcon,
  FileCode,
} from "lucide-react";
import { FileContentTypeResult } from "@/types/langgraph.types";
import { RENDER_FILE_ID_PREFIX } from "@/lib/constants";
import { ContentBlock } from "@/hooks/useFileUploadToAgent";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";

interface FileAttachmentProps {
  fileUrl: string;
  fileName?: string;
}

function useFileContentType(url: string | null): FileContentTypeResult {
  const [contentType, setContentType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    const fetchContentType = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) {
          const type = response.headers.get("content-type");
          setContentType(type);
        } else {
          setError(`Error fetching content type: ${response.status}`);
        }
      } catch (err) {
        setError(`Error: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentType();
  }, [url]);

  return { contentType, isLoading, error };
}

// File attachment component
function FileAttachment({
  fileUrl,
  fileName,
}: FileAttachmentProps): JSX.Element {
  const { contentType, isLoading } = useFileContentType(fileUrl);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Get file name from URL if not provided
  const displayName = fileName || fileUrl.split("/").pop() || "File";

  // Choose appropriate icon based on content type
  // Choose appropriate icon or render image based on content type
  const getFileIcon = () => {
    if (isLoading) return <FileIcon className="w-10 h-10 text-gray-400" />;

    if (contentType) {
      if (contentType.startsWith("image/")) {
        // Render the actual image
        return (
          <img
            src={fileUrl}
            alt={displayName}
            className="w-10 h-10 object-cover rounded-md"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        );
      }
      if (contentType.startsWith("text/"))
        return <FileTextIcon className="w-10 h-10 text-green-500" />;
      if (contentType.startsWith("audio/"))
        return <FileAudioIcon className="w-10 h-10 text-purple-500" />;
      if (contentType.startsWith("video/"))
        return <FileVideoIcon className="w-10 h-10 text-red-500" />;
      if (contentType.includes("zip") || contentType.includes("compressed"))
        return <FileArchiveIcon className="w-10 h-10 text-yellow-500" />;
      if (
        contentType.includes("application/json") ||
        contentType.includes("javascript") ||
        contentType.includes("xml")
      ) {
        return <FileCode className="w-10 h-10 text-orange-500" />;
      }
    }

    return <FileIcon className="w-10 h-10 text-gray-500" />;
  };

  const handleClick = () => {
    // Open file in new tab
    window.open(fileUrl, "_blank");
  };

  return (
    <div
      className="flex items-center p-3 bg-gray-100 rounded-lg max-w-xs hover:bg-gray-200 cursor-pointer transition-colors"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0 mr-3">{getFileIcon()}</div>
      <div className="overflow-hidden">
        <p className="font-medium text-sm truncate">{displayName}</p>
        <p className="text-xs text-gray-500 truncate">
          {isLoading ? "Loading..." : contentType || "Unknown type"}
        </p>
      </div>
    </div>
  );
}

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  console.log("humanmsg", message.id);
  const thread = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = removeKittyKatTags(getContentString(message.content));

  // Check if this is a file message
  const isFileMessage =
    message.id && message.id.startsWith(RENDER_FILE_ID_PREFIX);
  const fileUrl = isFileMessage ? contentString : null;

  const handleSubmitEdit = () => {
    setIsEditing(false);

    const newMessage: Message = { type: "human", content: value };
    thread.submit(
      {
        messages: [newMessage],
        userId: user!.id,
        currentBrandContextId: selectedBrandId,
      },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      }
    );
  };

  const isContentBlock = (block: unknown): block is ContentBlock => {
    return (
      typeof block === "object" &&
      block !== null &&
      "type" in block &&
      "source_type" in block &&
      ["file", "image", "audio"].includes((block as any).type)
    );
  };

  return (
    <div
      className={cn(
        "flex items-center w-[90%] justify-end   ml-auto gap-2 group",
        isEditing && "w-full max-w-lg"
      )}
    >
      <div className={cn("flex flex-col  gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className={cn("ml-auto", isFileMessage && "mt-4")}>
            {/* Render images and files if no text */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-wrap  items-end mb-3 justify-end gap-2">
                {message.content.map((block, idx) =>
                  isContentBlock(block) ? (
                    <FilePreview key={idx} block={block} size="md" />
                  ) : null
                )}
              </div>
            )}

            {/* Render text if present, otherwise fallback to file/image name */}
            {isFileMessage ? (
              <div className="ml-auto ">
                {fileUrl && (
                  <div className="mb-2">
                    <FileAttachment
                      fileUrl={fileUrl}
                      fileName={
                        new URL(fileUrl).pathname.split("/").pop() ||
                        "Uploaded File"
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <p
                className={`px-4 py-2 bg-blue-100 rounded-2xl  w-fit ml-auto whitespace-pre-wrap break-words`}
              >
                {contentString}
              </p>
            )}
          </div>
        )}
        {!isFileMessage && (
          <div
            className={cn(
              "flex gap-2 items-center ml-auto transition-opacity",
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              isEditing && "opacity-100"
            )}
          >
            <BranchSwitcher
              branch={meta?.branch}
              branchOptions={meta?.branchOptions}
              onSelect={(branch) => thread.setBranch(branch)}
              isLoading={isLoading}
            />
            <CommandBar
              isLoading={isLoading}
              content={contentString}
              isEditing={isEditing}
              setIsEditing={(c) => {
                if (c) {
                  setValue(contentString);
                }
                setIsEditing(c);
              }}
              handleSubmitEdit={handleSubmitEdit}
              isHumanMessage={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
