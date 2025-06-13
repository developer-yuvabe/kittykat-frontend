import * as React from "react";
import { cn, shimmer, toBase64 } from "@/lib/utils";
import { useState } from "react";
import { CircleX, Expand, Copy, Check, PinIcon, Info } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { ImageModal } from "../shared/ImageModal";
import { Checkbox } from "./checkbox";
import { DislikeIcon, LikeIcon } from "./custom-icon";

type ImageCardContextType = {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  overlayVisible?: boolean;
  setOverlayVisible?: (v: boolean) => void;
};

type ImageOverlayProps = {
  children: React.ReactNode;
  visible?: boolean;
};

const ImageCardContext = React.createContext<ImageCardContextType | undefined>(
  undefined
);

export const useImageCardContext = () => {
  const ctx = React.useContext(ImageCardContext);
  if (!ctx) throw new Error("ImageCard.* must be used inside <ImageCard.Root>");
  return ctx;
};

const ImageCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <ImageCardContext.Provider value={{ expanded, setExpanded }}>
      <div
        ref={ref}
        className={cn(
          "h-full flex flex-col rounded-lg border overflow-hidden bg-white min-h-80",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ImageCardContext.Provider>
  );
});
ImageCard.displayName = "ImageCard";

const ImageCardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-2 flex justify-end gap-2", className)} {...props} />
);
ImageCardHeader.displayName = "ImageCardHeader";

const ImageCardImage = ({
  className,
  src,
  alt = "Image",
  children,
}: {
  className?: string;
  src: string;
  alt?: string;
  children?: React.ReactNode;
}) => {
  const { setExpanded, expanded } = useImageCardContext();
  const [isLoadError, setIsLoadError] = useState(false);

  return (
    <div className="relative group">
      {isLoadError ? (
        <Image
          src={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
          alt={alt}
          width={700}
          height={475}
          className={cn("w-full h-full", className)}
          onClick={() => setExpanded(true)}
        />
      ) : (
        <Image
          alt={alt}
          src={src}
          width={700}
          height={475}
          onClick={() => setExpanded(true)}
          placeholder={`data:image/svg+xml;base64,${toBase64(
            shimmer(700, 475)
          )}`}
          className={cn("bg-muted object-contain aspect-square", className)}
          onError={() => setIsLoadError(true)}
        />
      )}
      {children}
      <ImageModal
        imageUrl={src}
        isOpen={expanded}
        onClose={() => setExpanded(false)}
      />
    </div>
  );
};

ImageCardImage.displayName = "ImageCardImage";

function Overlay({ children, visible }: ImageOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
        {
          "opacity-100": visible,
        }
      )}
    >
      {children}
    </div>
  );
}

function CheckboxSlot({
  className,
  isChecked,
  onCheckedChange,
}: {
  className?: string;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className={cn("absolute top-2 left-2 pointer-events-auto", className)}>
      <Checkbox
        checked={isChecked}
        onCheckedChange={(checked) => onCheckedChange(Boolean(checked))}
      />
    </div>
  );
}

function InfoSlot({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("absolute top-2 right-2 pointer-events-auto", className)}
    >
      {children}
    </div>
  );
}

function RateSlot({
  isLiked,
  onLikeDislike,
  className,
}: {
  isLiked?: boolean;
  onLikeDislike: (liked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-4 flex items-center justify-between text-white w-full px-3 pointer-events-auto",
        className
      )}
    >
      <div className="text-sm font-medium shadow-2xl">Rate this image</div>
      <div className="flex space-x-5">
        <DislikeIcon
          onClick={() => onLikeDislike(false)}
          size={16}
          color={isLiked === false ? "#636AE8" : "white"}
        />
        <LikeIcon
          onClick={() => onLikeDislike(true)}
          size={16}
          color={isLiked === true ? "#636AE8" : "white"}
        />
      </div>
    </div>
  );
}

const ImageOverlay = Object.assign(Overlay, {
  Checkbox: CheckboxSlot,
  Info: InfoSlot,
  Rate: RateSlot,
});

const ImageCardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-2 pt- flex justify-between flex-wrap gap-4", className)}
    {...props}
  />
);
ImageCardFooter.displayName = "ImageCardFooter";

const ImageActionsButton = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) => (
  <Button className={cn("w-full", className)} {...props}>
    {children}
  </Button>
);

const ImageActionsDelete = ({ onDelete }: { onDelete: () => void }) => (
  <TooltipIconButton
    tooltip="Remove"
    onClick={(e) => {
      e.stopPropagation();
      onDelete?.();
    }}
  >
    <CircleX size={20} className="cursor-pointer" />
  </TooltipIconButton>
);

const ImageActionsExpand = ({ onExpand }: { onExpand?: () => void }) => {
  const { setExpanded } = useImageCardContext();

  return (
    <TooltipIconButton
      tooltip="Expand"
      onClick={(e) => {
        e.stopPropagation();
        if (onExpand) {
          onExpand();
        } else {
          setExpanded(true);
        }
      }}
    >
      <Expand size={20} />
    </TooltipIconButton>
  );
};

const ImageActionsPrompt = ({ prompt }: { prompt: string }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipIconButton tooltip="Copy Prompt">
          <Copy className="cursor-pointer" />
        </TooltipIconButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-80 overflow-y-auto p-0">
        <div className="space-y-3 p-4">
          <div className="text-sm font-medium">Prompt</div>
          <p className="text-sm">{prompt}</p>
        </div>
        <div className="sticky bottom-0 w-full bg-popover p-4 pt-0">
          <Button onClick={handleCopy} className="w-full" variant="outline">
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                Copy Prompt
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ImageActionsPin = () => (
  <TooltipIconButton tooltip="Pin">
    <PinIcon size={20} className="cursor-pointer" />
  </TooltipIconButton>
);

const ImageActionsMetadata = ({
  metadata,
}: {
  metadata: Record<string, any>;
}) => {
  const [open, setOpen] = useState(false);

  const formatValue = (val: any) =>
    typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipIconButton tooltip="Info">
          <Info className="cursor-pointer" />
        </TooltipIconButton>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 max-w-5xl overflow-y-scroll">
        <div className="space-y-3">
          <div className="text-sm font-medium border-b pb-2">
            Image Metadata
          </div>
          <div className="space-y-2">
            {Object.entries(metadata)
              .filter(([key]) => key.toLowerCase() !== "prompt")
              .map(([key, value]) => (
                <div key={key} className="flex justify-between items-start">
                  <span className="text-sm capitalize font-medium">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-right max-w-32 break-words">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export {
  ImageCard,
  ImageCardHeader,
  ImageCardImage,
  ImageCardFooter,
  ImageActionsButton,
  ImageActionsDelete,
  ImageActionsExpand,
  ImageActionsPrompt,
  ImageActionsPin,
  ImageActionsMetadata,
  ImageOverlay,
};
