/**
 * Simple undo/redo manager for handling state history
 */
export interface UndoRedoManager<T> {
  push: (state: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export function createUndoRedoManager<T>(initialState?: T): UndoRedoManager<T> {
  const history: T[] = initialState ? [initialState] : [];
  let currentIndex = history.length - 1;

  return {
    push(state: T) {
      // Remove any redo history when pushing a new state
      if (currentIndex < history.length - 1) {
        history.splice(currentIndex + 1);
      }
      history.push(state);
      currentIndex = history.length - 1;
    },

    undo() {
      if (currentIndex > 0) {
        currentIndex--;
        return history[currentIndex];
      }
      return null;
    },

    redo() {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        return history[currentIndex];
      }
      return null;
    },

    canUndo() {
      return currentIndex > 0;
    },

    canRedo() {
      return currentIndex < history.length - 1;
    },

    clear() {
      history.length = 0;
      currentIndex = -1;
    },
  };
}
