import { Button } from "@/components/ui/button";
import { LoaderCircle, X, FileText as FileTextIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import UrlUploadDialog from "./UrlUploadDialog";
import {
  RENDER_FILE_ID_PREFIX,
  DO_NOT_RENDER_ID_PREFIX,
} from "@/lib/constants";
import {
  getFileIcon,
  addFileWrappers,
  removeFileWrappers,
} from "@/lib/langgraph.utils";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { MessageContentFiles } from "@/types/langgraph.types";
import { PinIcon, SendIcon } from "../ui/custom-icon";
import { ChatFilePreview } from "./ChatFilePreview";
import { useFileUpload } from "@/hooks/useFileUploadToAgent";
import { FileUploadPopover } from "./FileUploadPopover";
import { useStreamContext } from "@/providers/langgraph/Stream";

type ChatInputProps = {
  handleSubmit: (
    input: string,
    contentBlocks: any[],
    fileList: MessageContentFiles[]
  ) => void;
  hideToolCalls?: boolean;
  setHideToolCalls: (value: boolean) => void;
  threadId: string | null;
  brandId: string | null;
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
  handleSubmit: onSubmit,
  threadId,
  brandId,
}) => {
  const { removePinnedItem, pinnedItem } = usePinnedContextStore();
  const [input, setInput] = useState("");
  const [fileList, setFileList] = useState<MessageContentFiles[]>([]);
  const stream = useStreamContext();

  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
    isUploading,
  } = useFileUpload({ brandId });

  const handleAddFile = (url: string) => {
    addFileWrappers(url, setFileList);
  };

  const handleRemoveFile = (id: string) => {
    const trimmedId = id
      .replace(RENDER_FILE_ID_PREFIX, "")
      .replace(DO_NOT_RENDER_ID_PREFIX, "");
    removeFileWrappers(trimmedId, setFileList);
  };

  const resetFiles = () => {
    setFileList([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(input, contentBlocks, fileList);
    setInput("");
    setContentBlocks([]);
    resetFiles();
  };

  return (
    <div ref={dropRef} className="w-full">
      <div className="relative z-10 w-full min-w-full mb-3 border  shadow-xs bg-muted rounded-2xl flex flex-col">
        {pinnedItem && (
          <div className="p-3 bg-[#DEE1E6] rounded-t-2xl">
            <div className="flex gap-2 flex-wrap items-center">
              <PinIcon className="text-gray-700" />
              <div className="flex flex-col gap-1 flex-1 border-l pl-3 border-gray-900">
                <span className="text-xs text-gray-500">Focused only on</span>
                <div className="relative group flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {pinnedItem.title}
                  </span>
                </div>
                <button
                  onClick={() => removePinnedItem()}
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
          className="flex flex-col gap-2 w-full rounded-t-xl"
        >
          <ChatFilePreview blocks={contentBlocks} onRemove={removeBlock} />
          <div className="flex flex-row justify-between">
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
              className="p-6 border-none bg-transparent w-full placeholder:text-gray-400 shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none pr-24 max-h-32 overflow-auto scrollbar"
              onPaste={handlePaste}
            />

            <div className="flex items-center justify-end gap-x-4 px-4">
              {stream.isLoading ? (
                <Button key="stop" onClick={() => stream.stop()}>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Cancel
                </Button>
              ) : (
                <>
                  <FileUploadPopover
                    isFileUploading={isUploading}
                    handleAddFiles={handleFileUpload}
                  />

                  <UrlUploadDialog
                    onUploadComplete={handleAddFile}
                    prefix={threadId}
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={stream.isLoading || !input.trim() || isUploading}
                  >
                    <SendIcon size={10} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
