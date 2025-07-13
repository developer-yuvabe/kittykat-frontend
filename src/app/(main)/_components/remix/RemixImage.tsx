"use client";

import type React from "react";
import {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";

type RemixImageProps = {
  imageRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  url: string;
  remixHistory: ReturnType<typeof useUndoRedoRemix>;
  brushSize: number;
};

export type RemixImageHandle = {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  setBrushSize?: (size: number) => void;
};

const RemixImage = forwardRef<RemixImageHandle, RemixImageProps>(
  (
    { imageRef, canvasRef, offScreenCanvasRef, url, remixHistory, brushSize },
    ref
  ) => {
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [offScreenCtx, setOffScreenCtx] =
      useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [lastBrushSize, setLastBrushSize] = useState(brushSize);

    const {
      saveState,
      undo: undoState,
      redo: redoState,
      clear: clearHistory,
    } = remixHistory;

    const updateMainCanvas = useCallback(
      (showPreview = false, previewX?: number, previewY?: number) => {
        if (!ctx || !offScreenCanvasRef.current || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.globalAlpha = 0.2;
        ctx.drawImage(offScreenCanvasRef.current!, 0, 0);
        ctx.globalAlpha = 1.0;

        if (
          showPreview &&
          previewX !== undefined &&
          previewY !== undefined &&
          !isDrawing
        ) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.strokeStyle = "rgba(255, 255, 255, 1)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(previewX, previewY, brushSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      },
      [ctx, brushSize, isDrawing]
    );

    const rescaleExistingMask = useCallback(() => {
      if (
        !offScreenCtx ||
        !offScreenCanvasRef.current ||
        lastBrushSize === brushSize
      )
        return;

      const canvas = offScreenCanvasRef.current;
      const scaleFactor = brushSize / lastBrushSize;
      const currentImageData = offScreenCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const hasAlpha = currentImageData.data.some(
        (_, i) => i % 4 === 3 && currentImageData.data[i] > 0
      );

      if (!hasAlpha) return;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.putImageData(currentImageData, 0, 0);

      const iterations = Math.ceil(Math.abs(scaleFactor - 1) * 3);
      for (let i = 0; i < iterations; i++) {
        const imageData = tempCtx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const newData = new Uint8ClampedArray(imageData.data);

        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            if (scaleFactor > 1 && imageData.data[idx + 3] > 0) {
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nIdx = ((y + dy) * canvas.width + (x + dx)) * 4;
                  newData[nIdx + 3] = Math.max(
                    newData[nIdx + 3],
                    imageData.data[idx + 3]
                  );
                }
              }
            }
            if (scaleFactor < 1 && imageData.data[idx + 3] > 0) {
              let shouldKeep = true;
              for (let dy = -1; dy <= 1 && shouldKeep; dy++) {
                for (let dx = -1; dx <= 1 && shouldKeep; dx++) {
                  const nIdx = ((y + dy) * canvas.width + (x + dx)) * 4;
                  if (imageData.data[nIdx + 3] === 0) shouldKeep = false;
                }
              }
              if (!shouldKeep) newData[idx + 3] = 0;
            }
          }
        }

        const newImageData = new ImageData(
          newData,
          canvas.width,
          canvas.height
        );
        tempCtx.putImageData(newImageData, 0, 0);
      }

      const finalImageData = tempCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      offScreenCtx.clearRect(0, 0, canvas.width, canvas.height);
      offScreenCtx.putImageData(finalImageData, 0, 0);
    }, [offScreenCtx, brushSize, lastBrushSize]);

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
          offScreenContext.lineWidth = brushSize;
          offScreenContext.strokeStyle = "rgba(255, 255, 255, 1)";
          offScreenContext.clearRect(0, 0, canvas.width, canvas.height);

          setOffScreenCtx(offScreenContext);
          context.clearRect(0, 0, canvas.width, canvas.height);
          setCtx(context);

          const initialMask = offScreenContext.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          clearHistory(initialMask);
          setLastBrushSize(brushSize);
        }

        if (imageRef.current) {
          imageRef.current.width = image.naturalWidth;
          imageRef.current.height = image.naturalHeight;
        }
      };
    }, [url, clearHistory, brushSize]);

    const getPointerCoords = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getPointerCoords(e);
        setMousePos({ x, y });

        if (isDrawing && offScreenCtx) {
          offScreenCtx.lineWidth = brushSize;
          offScreenCtx.lineTo(x, y);
          offScreenCtx.stroke();
          updateMainCanvas();
        } else {
          updateMainCanvas(true, x, y);
        }
      },
      [isDrawing, offScreenCtx, brushSize, getPointerCoords, updateMainCanvas]
    );

    const startDrawing = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!offScreenCtx) return;

        setIsDrawing(true);
        const { x, y } = getPointerCoords(e);

        offScreenCtx.beginPath();
        offScreenCtx.moveTo(x, y);
        offScreenCtx.lineWidth = brushSize;
        updateMainCanvas();
      },
      [offScreenCtx, getPointerCoords, updateMainCanvas, brushSize]
    );

    const stopDrawing = useCallback(() => {
      if (!isDrawing || !offScreenCtx || !offScreenCanvasRef.current) return;

      setIsDrawing(false);
      const mask = offScreenCtx.getImageData(
        0,
        0,
        offScreenCanvasRef.current.width,
        offScreenCanvasRef.current.height
      );
      saveState(mask);

      if (mousePos) updateMainCanvas(true, mousePos.x, mousePos.y);
    }, [isDrawing, offScreenCtx, mousePos, saveState, updateMainCanvas]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getPointerCoords(e);
        setMousePos({ x, y });
        updateMainCanvas(true, x, y);
      },
      [getPointerCoords, updateMainCanvas]
    );

    const handleMouseLeave = useCallback(() => {
      setMousePos(null);
      updateMainCanvas(false);
      if (isDrawing && offScreenCtx && offScreenCanvasRef.current) {
        setIsDrawing(false);
        const mask = offScreenCtx.getImageData(
          0,
          0,
          offScreenCanvasRef.current.width,
          offScreenCanvasRef.current.height
        );
        saveState(mask);
      }
    }, [isDrawing, offScreenCtx, updateMainCanvas, saveState]);

    const undo = useCallback(() => {
      if (!offScreenCtx || !offScreenCanvasRef.current) return;

      const prev = undoState();
      if (prev) {
        offScreenCtx.putImageData(prev, 0, 0);
        updateMainCanvas(mousePos !== null, mousePos?.x, mousePos?.y);
      }
    }, [offScreenCtx, undoState, updateMainCanvas, mousePos]);

    const redo = useCallback(() => {
      if (!offScreenCtx || !offScreenCanvasRef.current) return;

      const next = redoState();
      if (next) {
        offScreenCtx.putImageData(next, 0, 0);
        updateMainCanvas(mousePos !== null, mousePos?.x, mousePos?.y);
      }
    }, [offScreenCtx, redoState, updateMainCanvas, mousePos]);

    const clearCanvas = useCallback(() => {
      if (!ctx || !offScreenCtx || !canvasRef.current) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      offScreenCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      const blank = offScreenCtx.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      clearHistory(blank);

      if (mousePos) updateMainCanvas(true, mousePos.x, mousePos.y);
    }, [
      ctx,
      offScreenCtx,
      canvasRef,
      clearHistory,
      mousePos,
      updateMainCanvas,
    ]);

    const setBrushSize = useCallback(
      (size: number) => {
        if (offScreenCtx && size !== lastBrushSize) {
          offScreenCtx.lineWidth = size;
          rescaleExistingMask();
          setLastBrushSize(size);
          updateMainCanvas(mousePos !== null, mousePos?.x, mousePos?.y);
        }
      },
      [
        offScreenCtx,
        lastBrushSize,
        mousePos,
        updateMainCanvas,
        rescaleExistingMask,
      ]
    );

    useImperativeHandle(
      ref,
      () => ({
        undo,
        redo,
        clearCanvas,
        setBrushSize,
      }),
      [undo, redo, clearCanvas, setBrushSize]
    );

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
          className="absolute top-0 left-0 cursor-none"
          style={{ pointerEvents: "auto" }}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    );
  }
);

RemixImage.displayName = "RemixImage";
export default RemixImage;
