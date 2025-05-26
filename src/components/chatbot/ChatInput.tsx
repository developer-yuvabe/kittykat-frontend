import { Button } from "@/components/ui/button";
import { FileText as FileTextIcon, LoaderCircle, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import UrlUploadDialog from "./UrlUploadDialog";

import { RENDER_FILE_ID_PREFIX } from "@/lib/constants";
import { getFileIcon } from "@/lib/langgraph.utils";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { MessageContentFiles } from "@/types/langgraph.types";
import { PinIcon, SendIcon } from "../ui/custom-icon";

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
  fileList: MessageContentFiles[];
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
  isLoading,
  stream,
  handleAddFile,
  fileList,
  handleRemoveFile,
  threadId,
}) => {
  const pinnedItem = usePinnedContextStore((state) => state.pinnedItem);
  const clearPins = usePinnedContextStore((state) => state.clearPinnedItem);

  return (
    <div className="relative z-10 w-full  mb-3 ml-auto mr-0 border shadow-xs bg-muted rounded-2xl">
      {pinnedItem && (
        <div className="p-3 bg-[#DEE1E6] rounded-t-2xl">
          <div className="flex gap-2 flex-wrap items-center">
            <PinIcon className="text-gray-700" />
            <div className="flex flex-col gap-1 flex-1 border-l pl-3 border-gray-900">
              <span className="text-xs text-gray-500">Focused only on</span>

              <div
                key={pinnedItem.id}
                className="relative group flex items-center gap-2"
              >
                <span className="text-sm font-semibold text-gray-900">
                  {pinnedItem.title}
                </span>
              </div>

              <button
                onClick={() => clearPins()}
                className="top-2 absolute right-2 rounded-full text-gray-400 hover:text-red-500 transition-opacity"
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
        className="grid grid-rows-[1fr_auto] gap-2 ml-auto mr-0 rounded-t-xl"
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
          placeholder="Type your message here..."
          className="p-6 border-none bg-transparent field-sizing-content placeholder:text-gray-400 shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none pr-24 max-h-32 overflow-auto scrollbar"
        />

        <div className="flex right-4 bottom-6 absolute">
          {stream.isLoading ? (
            <Button key="stop" onClick={() => stream.stop()}>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Cancel
            </Button>
          ) : (
            <div className="flex items-center">
              <UrlUploadDialog
                onUploadComplete={handleAddFile}
                prefix={threadId}
              />

              <Button
                type="submit"
                className="text-primary"
                variant="ghost"
                size="icon"
                disabled={isLoading || !input.trim()}
              >
                <SendIcon size={24} />
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
