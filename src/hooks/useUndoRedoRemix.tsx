import { useCallback, useState } from "react";

export const useUndoRedoRemix = (maxHistorySize = 50) => {
  const [history, setHistory] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const saveState = useCallback(
    (imageData: ImageData) => {
      setHistory((prev) => {
        // Remove any states after current index (for branching undo/redo)
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new state
        newHistory.push(imageData);

        // Limit history size to prevent memory issues
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex((prev) => Math.max(0, prev));
          return newHistory;
        }

        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [currentIndex, maxHistorySize]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const clear = useCallback((initialState?: ImageData) => {
    if (initialState) {
      setHistory([initialState]);
      setCurrentIndex(0);
    } else {
      setHistory([]);
      setCurrentIndex(-1);
    }
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    currentState: history[currentIndex] || null,
  };
};
