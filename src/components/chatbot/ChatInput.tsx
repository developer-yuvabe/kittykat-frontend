import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText as FileTextIcon,
  Image,
  Video,
  Music,
  File,
  LoaderCircle,
  Send,
  X,
  Pin,
} from "lucide-react";
import UrlUploadDialog from "./UrlUploadDialog";
import { MessageContentFileWrapper } from "../thread";
import { RENDER_FILE_ID_PREFIX } from "@/lib/constants";
import { fetchFileType } from "@/lib/langgraph.utils";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";

const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  text: FileTextIcon,
  application: FileTextIcon,
};

async function getFileIcon(url: string): Promise<React.ElementType> {
  const contentType = await fetchFileType(url);
  if (!contentType) return FileTextIcon;

  const [type] = contentType.split("/");
  return fileTypeIcons[type] || File;
}

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  hideToolCalls?: boolean;
  setHideToolCalls: (value: boolean) => void;
  isLoading: boolean;
  stream: {
    isLoading: boolean;
    stop: () => void;
  };
  handleAddFile: (url: string) => void;
  fileList: MessageContentFileWrapper[];
  handleRemoveFile: (id: string) => void;
  threadId: string | null;
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
      const icon = await getFileIcon(url);
      setFileIcon(() => icon);
      setLoading(false);
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

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSubmit,
  hideToolCalls,
  setHideToolCalls,
  isLoading,
  stream,
  handleAddFile,
  fileList,
  handleRemoveFile,
  threadId,
}) => {
  const pinnedItems = usePinnedContextStore((state) => state.pinnedItems);
  const removePinnedItem = usePinnedContextStore(
    (state) => state.removePinnedItem
  );

  const clearPins = usePinnedContextStore((state) => state.clearPinnedItems);
  // const clearPinnedItems = usePinnedContextStore((state) => state.clearPinnedItems);
  return (
    <div className="relative z-10 w-full max-w-2xl mb-1 ml-auto mr-0 border shadow-xs bg-muted rounded-2xl">
      {pinnedItems.length > 0 && (
        <div className="p-3 bg-gray-100 rounded-2xl mb-2">
          <div className="flex gap-2 flex-wrap">
            <Pin className="text-gray-700" />
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs text-gray-500">Focused only on</span>
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group flex items-center gap-2"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </span>
                  <button
                    onClick={() => removePinnedItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => clearPins()}
                className="top-2 absolute right-2 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {fileList.length > 0 && (
        <div className="p-3 border-b flex space-x-2 overflow-x-auto">
          {fileList
            .filter((fileWrapper) =>
              fileWrapper.id.startsWith(RENDER_FILE_ID_PREFIX)
            )
            .map((fileWrapper) => (
              <FileThumbnail
                key={fileWrapper.id}
                url={fileWrapper.file.text}
                onRemove={() => handleRemoveFile(fileWrapper.id)}
                name={
                  new URL(fileWrapper.file.text).pathname.split("/").pop() ||
                  "Uploaded File"
                }
              />
            ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl ml-auto mr-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.metaKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              const el = e.target as HTMLElement | undefined;
              const form = el?.closest("form");
              form?.requestSubmit();
            }
          }}
          placeholder="Message"
          className="p-6  border-none bg-transparent  field-sizing-content placeholder:text-gray-400 shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none"
        />

        <div className="flex right-4 bottom-6 absolute">
          {stream.isLoading ? (
            <Button key="stop" onClick={() => stream.stop()}>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Cancel
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <UrlUploadDialog
                onUploadComplete={handleAddFile}
                prefix={threadId}
              />

              <button
                type="submit"
                className="text-[#636AE8]"
                disabled={isLoading || !input.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
