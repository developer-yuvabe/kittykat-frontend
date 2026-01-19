export function useSessionStorage() {
  const setSessionItem = <T,>(key: string, value: T): void => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to set sessionStorage key "${key}"`, err);
    }
  };

  const getSessionItem = <T,>(key: string): T | null => {
    try {
      if (typeof window === "undefined") return null; // Ensure this runs in a browser context
      const item = sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (err) {
      console.error(`Failed to get sessionStorage key "${key}"`, err);
      return null;
    }
  };

  const updateSessionItem = <T,>(
    key: string,
    updater: (current: T | null) => T
  ): void => {
    try {
      const current = getSessionItem<T>(key);
      const updated = updater(current);
      setSessionItem(key, updated);
    } catch (err) {
      console.error(`Failed to update sessionStorage key "${key}"`, err);
    }
  };

  const removeSessionItem = (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (err) {
      console.error(`Failed to remove sessionStorage key "${key}"`, err);
    }
  };

  const deleteSessionItem = (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (err) {
      console.error(`Failed to delete sessionStorage key "${key}"`, err);
    }
  };

  const clearSessionStorage = (): void => {
    try {
      sessionStorage.clear();
    } catch (err) {
      console.error("Failed to clear sessionStorage", err);
    }
  };

  return {
    setSessionItem,
    getSessionItem,
    updateSessionItem,
    deleteSessionItem,
    removeSessionItem,
    clearSessionStorage,
  };
}
