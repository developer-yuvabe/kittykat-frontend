import { toast } from "sonner";
import { useCallback, useRef } from "react";

interface UndoableOptions<T> {
  action: () => Promise<T>; // async operation
  title: string; // display name of entity
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  undoSeconds?: number; // 0 disables undo delay
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
    }: UndoableOptions<T>) => {
      undoneRef.current = false;

      // Case 1: No undo functionality (undoSeconds = 0)
      if (undoSeconds <= 0) {
        const promise = action();
        toast.promise(promise, {
          loading: loadingMessage || `Processing "${title}"...`,
          success: successMessage || `"${title}" processed successfully.`,
          error: errorMessage || `Failed to process "${title}".`,
        });
        return;
      }

      // Case 2: Undoable operation
      const undoablePromise = new Promise(async (resolve, reject) => {
        // Wait for undoSeconds before executing
        await new Promise((r) => setTimeout(r, undoSeconds * 1000));

        if (undoneRef.current) {
          reject("Undone");
          return;
        }

        try {
          const result = await action();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      toast.promise(undoablePromise, {
        loading: (
          <div className="flex items-center gap-3">
            <span>{loadingMessage || `Processing "${title}"...`}</span>
            <button
              className="ml-auto text-blue-600 font-medium"
              onClick={() => {
                undoneRef.current = true;
              }}
            >
              Undo
            </button>
          </div>
        ),
        success: successMessage || `"${title}" processed successfully.`,
        error: (err) =>
          err === "Undone"
            ? `Cancelled "${title}" action.`
            : errorMessage || `Failed to process "${title}".`,
      });
    },
    []
  );

  return { execute };
}
