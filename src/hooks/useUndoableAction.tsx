import { toast } from "sonner";
import { useCallback, useRef } from "react";

interface UndoableOptions<T> {
  action: () => Promise<T>;
  title: string;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  undoSeconds?: number;
  onUndo?: () => void;
}

export function useUndoableAction() {
  const undoneRef = useRef(false);

  const execute = useCallback(
    async <T,>({
      action,
      title,
      successMessage,
      errorMessage,
      loadingMessage,
      undoSeconds = 3,
      onUndo,
    }: UndoableOptions<T>) => {
      undoneRef.current = false;

      if (undoSeconds <= 0) {
        toast.promise(action(), {
          loading: loadingMessage || `Processing "${title}"...`,
          success: successMessage || `"${title}" processed successfully.`,
          error: errorMessage || `Failed to process "${title}".`,
        });
        return;
      }

      let secondsLeft = undoSeconds;

      const baseMsg = loadingMessage || `Processing "${title}"...`;

      const toastId = toast.loading(`${baseMsg} (${secondsLeft})`, {
        id: `undo-${title}`,
        action: {
          label: "Undo",
          onClick: () => {
            undoneRef.current = true;
            toast.dismiss(toastId);
          },
        },
      });

      const interval = setInterval(() => {
        secondsLeft -= 1;

        // While countdown is running → update text & keep Undo
        if (secondsLeft > 0 && !undoneRef.current) {
          toast.loading(`${baseMsg} (${secondsLeft})`, { id: toastId });
        }

        // When countdown hits 0 → remove undo and countdown text
        if (secondsLeft === 0 && !undoneRef.current) {
          toast.loading(baseMsg, {
            id: toastId,
            action: undefined, // Removes Undo button
          });
        }
      }, 1000);

      await new Promise((resolve) => setTimeout(resolve, undoSeconds * 1000));
      clearInterval(interval);

      if (undoneRef.current) {
        onUndo?.();
        return;
      }

      try {
        await action();
        toast.dismiss(toastId);
        toast.success(successMessage || `"${title}" processed successfully.`);
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(errorMessage || `Failed to process "${title}".`);
      }
    },
    []
  );

  return { execute };
}
