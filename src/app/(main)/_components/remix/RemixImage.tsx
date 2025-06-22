"use client";

import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";

type RemixImageProps = {
  imageRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  url: string;
  remixHistory: ReturnType<typeof useUndoRedoRemix>;
};

export type RemixImageHandle = {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
};

const RemixImage = forwardRef<RemixImageHandle, RemixImageProps>(
  ({ imageRef, canvasRef, offScreenCanvasRef, url, remixHistory }, ref) => {
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [offScreenCtx, setOffScreenCtx] =
      useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const {
      saveState,
      undo: undoState,
      redo: redoState,
      clear: clearHistory,
      canUndo,
      canRedo,
    } = remixHistory;

    const updateMainCanvas = useCallback(() => {
      if (!ctx || !offScreenCanvasRef.current || !canvasRef.current) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.globalAlpha = 0.2;
      ctx.drawImage(offScreenCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1.0;
    }, [ctx]);

    const undo = useCallback(() => {
      if (!canUndo || !offScreenCtx || !offScreenCanvasRef.current) return;

      const previousState = undoState();
      if (previousState) {
        offScreenCtx.putImageData(previousState, 0, 0);
        updateMainCanvas();
      }
    }, [canUndo, offScreenCtx, undoState, updateMainCanvas]);

    const redo = useCallback(() => {
      if (!canRedo || !offScreenCtx || !offScreenCanvasRef.current) return;

      const nextState = redoState();
      if (nextState) {
        offScreenCtx.putImageData(nextState, 0, 0);
        updateMainCanvas();
      }
    }, [canRedo, offScreenCtx, redoState, updateMainCanvas]);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !ctx || !offScreenCtx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offScreenCtx.clearRect(0, 0, canvas.width, canvas.height);

      const blankState = offScreenCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      clearHistory(blankState);
    }, [ctx, offScreenCtx, clearHistory]);

    useImperativeHandle(
      ref,
      () => ({
        undo,
        redo,
        clearCanvas,
      }),
      [undo, redo, clearCanvas]
    );

    useEffect(() => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = url;

      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.width = canvas.width;
        offScreenCanvas.height = canvas.height;
        offScreenCanvasRef.current = offScreenCanvas;

        const context = canvas.getContext("2d", { alpha: true });
        const offScreenContext = offScreenCanvas.getContext("2d", {
          alpha: true,
        });

        if (context && offScreenContext) {
          offScreenContext.lineJoin = "round";
          offScreenContext.lineCap = "round";
          offScreenContext.lineWidth = 80;
          offScreenContext.strokeStyle = "rgba(255, 255, 255, 1)";
          offScreenContext.setLineDash([]);
          offScreenContext.clearRect(0, 0, canvas.width, canvas.height);
          setOffScreenCtx(offScreenContext);

          context.clearRect(0, 0, canvas.width, canvas.height);
          setCtx(context);

          const initialMaskState = offScreenContext.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          clearHistory(initialMaskState);
        }

        if (imageRef.current) {
          imageRef.current.width = image.naturalWidth;
          imageRef.current.height = image.naturalHeight;
        }
      };
    }, [url, clearHistory]);

    const getPointerCoords = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      },
      []
    );

    const startDrawing = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!offScreenCtx) return;

        setIsDrawing(true);
        const { x, y } = getPointerCoords(e);
        offScreenCtx.beginPath();
        offScreenCtx.moveTo(x, y);
        updateMainCanvas();
      },
      [offScreenCtx, getPointerCoords, updateMainCanvas]
    );

    const draw = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !offScreenCtx || !canvasRef.current) return;

        const { x, y } = getPointerCoords(e);
        offScreenCtx.lineTo(x, y);
        offScreenCtx.stroke();
        updateMainCanvas();
      },
      [isDrawing, offScreenCtx, getPointerCoords, updateMainCanvas]
    );

    const stopDrawing = useCallback(() => {
      if (!isDrawing || !offScreenCtx || !offScreenCanvasRef.current) return;

      setIsDrawing(false);

      const currentMaskState = offScreenCtx.getImageData(
        0,
        0,
        offScreenCanvasRef.current.width,
        offScreenCanvasRef.current.height
      );
      saveState(currentMaskState);
    }, [isDrawing, offScreenCtx, saveState]);

    return (
      <div className="relative">
        <img
          ref={imageRef}
          src={url}
          crossOrigin="anonymous"
          alt="Editable"
          className="block max-h-[85vh] object-contain border w-max"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (canvasRef.current) {
              canvasRef.current.style.width = `${img.clientWidth}px`;
              canvasRef.current.style.height = `${img.clientHeight}px`;
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ pointerEvents: "auto" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    );
  }
);

RemixImage.displayName = "RemixImage";
export default RemixImage;
