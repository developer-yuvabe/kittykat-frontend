"use client";

import React, { useRef, useState, useEffect } from "react";
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
import { Eraser, X } from "lucide-react";

export default function MaskingDialog() {
  const { remixUrl, setRemixUrl, remixSize } = useRemixStore();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

      const context = canvas.getContext("2d");
      if (context) {
        context.lineJoin = "round";
        context.lineCap = "round";
        context.lineWidth = 30;
        context.strokeStyle = "rgba(0, 0, 0, 0.3)";
        context.setLineDash([]);
        setCtx(context);
      }

      if (imageRef.current) {
        imageRef.current.width = image.naturalWidth;
        imageRef.current.height = image.naturalHeight;
      }
    };
  }, [remixUrl]);

  const getPointerCoords = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPointerCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx || !canvasRef.current) return;
    const { x, y } = getPointerCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, type);
    });

  const handleSubmit = async (data: z.infer<typeof remixImageSchema>) => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    try {
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height;

      const compositeCtx = compositeCanvas.getContext("2d");
      if (!compositeCtx) throw new Error("Failed to get canvas context");

      compositeCtx.drawImage(image, 0, 0);
      compositeCtx.drawImage(canvas, 0, 0);

      const blob = await canvasToBlob(compositeCanvas, "image/png");
      const file = new File([blob], "mask-image.png", { type: "image/png" });

      // Download the file for debugging purposes
      // const downloadLink = document.createElement("a");
      // downloadLink.href = URL.createObjectURL(file);
      // downloadLink.download = "mask-image.png";
      // document.body.appendChild(downloadLink);
      // downloadLink.click();
      // document.body.removeChild(downloadLink);

      const maskUrl = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "remix",
        file
      );

      remixImageService(selectedBrandId!, user!.id, data, maskUrl);
      setRemixUrl(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process the mask.");
    }
  };

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
              <Button variant="outline" size="icon" onClick={clearCanvas}>
                <Eraser />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRemixUrl(null)}
              >
                <X />
              </Button>
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
                  // Set canvas size to match image's DISPLAYED size
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
