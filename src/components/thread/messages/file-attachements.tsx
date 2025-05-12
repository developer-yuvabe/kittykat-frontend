import { useState, useEffect } from "react";
import { Message } from "@langchain/langgraph-sdk";
import {
  FileTextIcon,
  Image,
  Video,
  Music,
  File,
  LoaderCircle,
  X,
} from "lucide-react";
import { RENDER_FILE_ID_PREFIX } from "@/lib/constants";
import { fetchFileType } from "@/lib/langgraph.utils";
import { MessageContentFileWrapper } from "@/types/langgraph.types";

const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  text: FileTextIcon,
  application: FileTextIcon,
};

const FileThumbnail = ({
  url,
  onRemove,
  name,
}: {
  url: string;
  onRemove: () => void;
  name: string;
}) => {
  const [FileIcon, setFileIcon] = useState<React.ElementType>(
    () => FileTextIcon
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIcon = async () => {
      setLoading(true);
      try {
        const contentType = await fetchFileType(url);
        const [type] = contentType.split("/");
        setFileIcon(() => fileTypeIcons[type] || File);
      } catch (error) {
        console.error("Error setting file icon:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIcon();
  }, [url]);

  return (
    <div className="relative group w-16 h-16">
      {loading ? (
        <LoaderCircle className="w-8 h-8 animate-spin text-gray-400" />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
          <FileIcon className="w-8 h-8 text-gray-500" />
          <div className="absolute bottom-0 left-0 right-0 text-xs text-center text-gray-500 truncate">
            {name}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export function MessageAttachments({
  files,
  onRemoveFile,
}: {
  files: MessageContentFileWrapper[];
  onRemoveFile: (id: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap mb-2">
      {files.map((file) => (
        <FileThumbnail
          key={file.id}
          url={file.url}
          name={file.name}
          onRemove={() => onRemoveFile(file.id)}
        />
      ))}
    </div>
  );
}

export function processMessagesWithFiles(
  messages: Message[],
  fileList: MessageContentFileWrapper[]
): {
  messages: Message[];
  messageFiles: Record<string, MessageContentFileWrapper[]>;
} {
  const messageFiles: Record<string, MessageContentFileWrapper[]> = {};
  const processedMessages: Message[] = [];

  // First pass: identify file messages and collect their attachments
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check if this is a file attachment message
    if (message.id && message.id.startsWith(RENDER_FILE_ID_PREFIX)) {
      // Find the previous non-file message to attach this file to
      let targetMessageIndex = i - 1;
      while (
        targetMessageIndex >= 0 &&
        messages[targetMessageIndex].id?.startsWith(RENDER_FILE_ID_PREFIX)
      ) {
        targetMessageIndex--;
      }

      if (targetMessageIndex >= 0) {
        const targetMessage = messages[targetMessageIndex];
        const targetId = targetMessage.id || `message-${targetMessageIndex}`;

        // Find the corresponding file in fileList
        const fileId = message.id.replace(RENDER_FILE_ID_PREFIX, "");
        const fileData = fileList.find((file) => file.id === fileId);

        if (fileData) {
          if (!messageFiles[targetId]) {
            messageFiles[targetId] = [];
          }
          messageFiles[targetId].push(fileData);
        }
      }
    } else {
      // Regular message - include in processed messages
      processedMessages.push(message);
    }
  }

  return { messages: processedMessages, messageFiles };
}
