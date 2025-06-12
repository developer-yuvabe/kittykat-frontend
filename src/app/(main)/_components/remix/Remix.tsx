"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemixStore } from "@/store/remix.store";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";
import { remixImageSchema } from "@/schema/remix.schema";
import { toast } from "sonner";
import { remixImageService } from "@/services/api/remix.service";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import RemixInput from "./RemixInput";
import { z } from "zod";
import { Eraser, X, Undo, Redo } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";

export default function MaskingDialog() {
  const { remixUrl, setRemixUrl, remixSize } = useRemixStore();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [offScreenCtx, setOffScreenCtx] =
    useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // State for undo/redo

  // Use the custom undo/redo hook
  const {
    saveState,
    undo: undoState,
    redo: redoState,
    clear: clearHistory,
    canUndo,
    canRedo,
  } = useUndoRedoRemix();

  // Initialize canvas and contexts
  useEffect(() => {
    if (!remixUrl) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = remixUrl;

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set internal canvas resolution
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      // Create off-screen canvas for mask drawing
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.width = canvas.width;
      offScreenCanvas.height = canvas.height;
      offScreenCanvasRef.current = offScreenCanvas;

      const context = canvas.getContext("2d", { alpha: true });
      const offScreenContext = offScreenCanvas.getContext("2d", {
        alpha: true,
      });

      if (context && offScreenContext) {
        // Configure off-screen canvas for mask drawing
        offScreenContext.lineJoin = "round";
        offScreenContext.lineCap = "round";
        offScreenContext.lineWidth = 80;
        offScreenContext.strokeStyle = "rgba(255, 255, 255, 1)";

        offScreenContext.setLineDash([]);
        offScreenContext.clearRect(0, 0, canvas.width, canvas.height);
        setOffScreenCtx(offScreenContext);

        // Configure main canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        setCtx(context);

        // Initialize history with blank mask state
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
  }, [remixUrl, clearHistory]);

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

  const updateMainCanvas = useCallback(() => {
    if (!ctx || !offScreenCanvasRef.current || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.globalAlpha = 0.2;
    ctx.drawImage(offScreenCanvasRef.current, 0, 0);
    ctx.globalAlpha = 1.0;
  }, [ctx]);

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

    // Save the current mask state to history (from off-screen canvas)
    const currentMaskState = offScreenCtx.getImageData(
      0,
      0,
      offScreenCanvasRef.current.width,
      offScreenCanvasRef.current.height
    );
    saveState(currentMaskState);
  }, [isDrawing, offScreenCtx, saveState]);

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

    // Clear both canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    offScreenCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset history with blank state
    const blankState = offScreenCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    clearHistory(blankState);
  }, [ctx, offScreenCtx, clearHistory]);

  const canvasToBlob = useCallback(
    (canvas: HTMLCanvasElement, type: string) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, type);
      }),
    []
  );

  const handleSubmit = useCallback(
    async (data: z.infer<typeof remixImageSchema>) => {
      const image = imageRef.current;
      const offScreenCanvas = offScreenCanvasRef.current;
      if (!image || !offScreenCanvas) return;

      try {
        // Create composite canvas for final mask
        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = offScreenCanvas.width;
        compositeCanvas.height = offScreenCanvas.height;

        const compositeCtx = compositeCanvas.getContext("2d", { alpha: true });
        if (!compositeCtx) throw new Error("Failed to get canvas context");

        // Draw the original image
        compositeCtx.globalCompositeOperation = "source-over";
        compositeCtx.drawImage(image, 0, 0);

        // Draw the mask with transparency
        compositeCtx.globalAlpha = 0.7;
        compositeCtx.drawImage(offScreenCanvas, 0, 0);
        compositeCtx.globalAlpha = 1.0;

        const blob = await canvasToBlob(compositeCanvas, "image/png");
        const file = new File([blob], "mask-image.png", { type: "image/png" });

        const maskUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "remix",
          file
        );

        await remixImageService(selectedBrandId!, user!.id, data, maskUrl);
        setRemixUrl(null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to process the mask.");
      }
    },
    [selectedBrandId, user, canvasToBlob, setRemixUrl]
  );

  return (
    <Dialog
      open={!!remixUrl}
      onOpenChange={(open) => {
        if (!open) setRemixUrl(null);
      }}
    >
      <DialogContent
        className="p-4 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col justify-between"
        hideCloseIcon
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-between">
            <DialogTitle>Remix Image</DialogTitle>
            <div className="flex gap-2 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undo}
                    disabled={!canUndo}
                  >
                    <Undo />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo last action</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={redo}
                    disabled={!canRedo}
                  >
                    <Redo />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo last action</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={clearCanvas}>
                    <Eraser />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear canvas</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRemixUrl(null)}
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close dialog</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-center items-center overflow-auto max-h-[75vh] max-w-[95vw] mx-auto scrollbar">
          <div className="relative">
            <img
              ref={imageRef}
              src={remixUrl || ""}
              crossOrigin="anonymous"
              alt="Editable"
              className="block max-w-[95vw] max-h-[75vh] object-contain border w-max"
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
        </div>

        {remixUrl && (
          <RemixInput
            remixUrl={remixUrl}
            remixSize={remixSize || "1024x1024"}
            handleSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
