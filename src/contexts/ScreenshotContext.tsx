"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ScreenshotContextType {
  captureScreenshot: (() => Promise<string | null>) | null;
  isReady: boolean;
  registerCaptureFunction: (fn: () => Promise<string | null>) => void;
}

const ScreenshotContext = createContext<ScreenshotContextType>({
  captureScreenshot: null,
  isReady: false,
  registerCaptureFunction: () => {},
});

interface ScreenshotProviderProps {
  children: ReactNode;
}

export const ScreenshotProvider: React.FC<ScreenshotProviderProps> = ({
  children,
}) => {
  const [captureScreenshot, setCaptureScreenshot] = useState<
    (() => Promise<string | null>) | null
  >(null);

  const registerCaptureFunction = useCallback(
    (fn: () => Promise<string | null>) => {
      setCaptureScreenshot(() => fn);
    },
    []
  );

  const value = {
    captureScreenshot,
    isReady: captureScreenshot !== null,
    registerCaptureFunction,
  };

  return (
    <ScreenshotContext.Provider value={value}>
      {children}
    </ScreenshotContext.Provider>
  );
};

export const useScreenshot = () => {
  const context = useContext(ScreenshotContext);
  if (!context) {
    throw new Error("useScreenshot must be used within a ScreenshotProvider");
  }
  return context;
};
