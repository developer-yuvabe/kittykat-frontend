import { RemixImageHandle } from "@/app/(main)/_components/remix/RemixImage";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import React, { createContext, useContext, useRef, useState } from "react";

type RemixHistory = ReturnType<typeof useUndoRedoRemix>;

type RemixCanvasContextType = {
  brushSize: number;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  remixImageRef: React.RefObject<RemixImageHandle | null>;
  remixHistory: RemixHistory;
};

const RemixCanvasContext = createContext<RemixCanvasContextType | null>(null);

export const RemixCanvasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [brushSize, setBrushSize] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  return (
    <RemixCanvasContext.Provider
      value={{
        brushSize,
        setBrushSize,
        canvasRef,
        offScreenCanvasRef,
        imageRef,
        remixImageRef,
        remixHistory,
      }}
    >
      {children}
    </RemixCanvasContext.Provider>
  );
};

export const useRemixCanvas = () => {
  const context = useContext(RemixCanvasContext);
  if (!context) {
    throw new Error("useRemixCanvas must be used inside <RemixCanvasProvider>");
  }
  return context;
};
