import { Button } from "@/components/ui/button";
import {
  LoaderCircle,
  X,
  FileText as FileTextIcon,
  Mic,
  Check,
} from "lucide-react";
import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import { RENDER_FILE_ID_PREFIX } from "@/lib/constants";
import {
  getFileIcon,
  addFileWrappers,
  removeFileWrappers,
  getPinnedItemContextMessage,
  ensureToolCallsHaveResponses,
} from "@/lib/langgraph.utils";
import { scrollToBottom } from "@/lib/scroll.utils"; // Import your utility function
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { MessageContentFiles } from "@/types/langgraph.types";
import { PinIcon, SendIcon } from "../ui/custom-icon";
import { ChatFilePreview } from "./ChatFilePreview";
import { FileUploadPopover } from "./FileUploadPopover";
import { useFileUpload } from "@/hooks/useFileUploadToAgent";

import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { useUserStore } from "@/store/user.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useBrandStore } from "@/store/brand.store";
import { transcribeAudio } from "@/services/api/speechtotext.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import AgentPdfAttachmentUploader from "./AgentPdfAttachmentUploader";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";

type ChatInputProps = {
  setFirstTokenReceived: (value: boolean) => void;
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
  setFirstTokenReceived,
}) => {
  const { selectedImageGenerationModel } = useModelsStore();
  const { removePinnedItem, pinnedItem } = usePinnedContextStore();
  const { user } = useUserStore();
  const { selectedBrandId, selectedMoodboardId, selectedCampaignId } =
    useBrandStore();
  const stream = useStreamContext();
  const { isLoading, stop } = stream;

  const [input, setInput] = useState("");
  const [fileList, setFileList] = useState<MessageContentFiles[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null); // NEW
  const wasCancelledRef = useRef(false);
  const [, setPermissionDenied] = useState(false);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setPermissionDenied(false); // Reset permission denied state
      return stream;
    } catch (err) {
      console.error("Microphone access error:", err);
      setPermissionDenied(true); // Set flag for permission denied
      setShowMicPermissionDialog(true);
      return null;
    }
  };

  const startRecording = async () => {
    const stream = await requestMicrophonePermission();
    if (!stream) {
      return;
    }

    try {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setMediaRecorder(null);

        if (wasCancelledRef.current) {
          wasCancelledRef.current = false;
          return; // Don't transcribe
        }

        // ✅ Stop the microphone completely
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);

        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        const file = new File([audioBlob], "recording.webm", {
          type: recorder.mimeType,
        });

        try {
          setIsTranscribing(true);
          const transcription = await transcribeAudio(file);
          setInput((prev) =>
            prev.trim() ? prev + " " + transcription : transcription
          );
        } catch (err) {
          console.error("Transcription failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    // Optional safety: Stop media stream immediately here too
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    await new Promise((res) => setTimeout(res, 1000));
  };

  const cancelRecording = async () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      wasCancelledRef.current = true;
      mediaRecorder.stop();
    }

    // Stop stream as well
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    await new Promise((res) => setTimeout(res, 1000));
  };

  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    handlePaste,
    isUploading,
  } = useFileUpload({ brandId: user?.thread_id || "" });

  const handleAddFile = useCallback((url: string) => {
    addFileWrappers(url, setFileList);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    const trimmedId = id
      .replace(RENDER_FILE_ID_PREFIX, "")
      .replace("DO_NOT_RENDER_", "");
    removeFileWrappers(trimmedId, setFileList);
  }, []);

  const resetFiles = useCallback(() => {
    setFileList([]);
    setContentBlocks([]);
  }, [setContentBlocks]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      setFirstTokenReceived(false);

      const pinnedContextMessage: string | null = pinnedItem
        ? getPinnedItemContextMessage(pinnedItem)
        : null;

      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [
          {
            type: "text",
            text: pinnedContextMessage
              ? `${pinnedContextMessage}${input.trimEnd()}`
              : input.trimEnd(),
          },
          ...contentBlocks,
        ] as Message["content"],
      };

      const newFileList: Message[] = fileList.map((item) => ({
        id: item.id,
        type: "human",
        content: [
          {
            type: "text",
            text: item.file.text,
          },
        ],
      }));

      // Handle message submission directly
      const messages = [...newFileList, newHumanMessage];
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);

      stream.submit(
        {
          messages: [...toolMessages, ...messages],
          userId: user!.id,
          currentBrandContextId: selectedBrandId,
          previousBrandContextId: stream.values.previousBrandContextId,
          currentCampaignId: selectedCampaignId,
          currentMoodboardId: selectedMoodboardId,
          currentSelectedImageGenerationModelId:
            selectedImageGenerationModel?.id ?? null,
          userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        },
        {
          streamMode: ["values"],
          optimisticValues: (prev) => ({
            ...prev,
            messages: [...(prev.messages ?? []), ...toolMessages, ...messages],
          }),
        }
      );

      // Reset local state after submission
      setInput("");
      resetFiles();

      // Scroll to bottom after sending message using your utility function
      scrollToBottom(100);
    },
    [
      input,
      isLoading,
      setFirstTokenReceived,
      pinnedItem,
      contentBlocks,
      fileList,
      resetFiles,
      stream,
      user,
      selectedBrandId,
    ]
  );

  // Inside ChatInput component
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const updatePlaceholderVisibility = () => {
      const width = textareaRef.current?.offsetWidth || 0;
      setShowPlaceholder(width > 150); // threshold, adjust as needed
    };

    updatePlaceholderVisibility();

    const observer = new ResizeObserver(updatePlaceholderVisibility);
    if (textareaRef.current) {
      observer.observe(textareaRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={dropRef}
      className="relative z-10 w-full min-w-full mb-3 border shadow-xs bg-muted rounded-2xl flex flex-col"
    >
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
        <div className="flex flex-row justify-between items-center p-6">
          {!(isRecording || isTranscribing) ? (
            <textarea
              ref={textareaRef}
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
              placeholder={
                showPlaceholder ? "Type your message here..." : "Type here..."
              }
              className="p-2 border-none bg-transparent w-full placeholder:text-gray-400 shadow-none placeholder:text-sm lg:placeholder:text-base ring-0 outline-none focus:outline-none focus:ring-0 resize-none pr-24 overflow-auto scrollbar"
              onPaste={handlePaste}
            />
          ) : (
            <div className="w-full h-16 p-4 rounded-lg flex items-center justify-center space-x-1 overflow-hidden ">
              {[...Array(35)].map((_, index) => (
                <div
                  key={index}
                  className="frequency-bar w-2 bg-gray-300 rounded"
                  style={{
                    height: `${Math.random() * 40 + 30}px`,
                  }}
                ></div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-x-4 px-4">
            {isLoading ? (
              <Button key="stop" onClick={() => stop()}>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Cancel
              </Button>
            ) : isRecording || isTranscribing ? (
              <div className="flex items-center gap-2">
                {isTranscribing ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin text-blue-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                    title="Send Recording"
                  >
                    <Check size={20} className="text-primary cursor-pointer" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={cancelRecording}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  title="Cancel Recording"
                >
                  <X size={20} className="text-primary cursor-pointer" />
                </button>
              </div>
            ) : (
              <>
                <FileUploadPopover
                  isFileUploading={isUploading}
                  handleAddFiles={handleFileUpload}
                />
                <AgentPdfAttachmentUploader onUploadComplete={handleAddFile} />
                <button
                  type="button"
                  onClick={startRecording}
                  title="Start Recording"
                  disabled={isTranscribing}
                >
                  <Mic size={20} className="text-primary cursor-pointer" />
                </button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={
                    isLoading ||
                    !input.trim() ||
                    isUploading ||
                    isTranscribing ||
                    isRecording
                  }
                >
                  <SendIcon size={10} />
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
      <Dialog
        open={showMicPermissionDialog}
        onOpenChange={setShowMicPermissionDialog}
      >
        <DialogContent hideCloseIcon>
          <DialogHeader>
            <DialogTitle>Microphone Permission Denied</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Your browser has blocked access to the microphone. Please allow
              microphone access from your browser settings and try again.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="default"
                onClick={() => setShowMicPermissionDialog(false)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
