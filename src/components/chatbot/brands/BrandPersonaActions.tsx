import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import {
  Copy,
  Edit,
  MoreVertical,
  Pin,
  PinOff,
  WandSparkles,
} from "lucide-react";

interface BrandPersonaActionsProps {
  isPinned: boolean;
  onPin: () => void;
  onChat: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCopyContext: () => void;
}

export function BrandPersonaActions({
  isPinned,
  onPin,
  onChat,
  onEdit,
  onDuplicate,
  onCopyContext,
}: BrandPersonaActionsProps) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-2">
      <TooltipIconButton
        size="icon"
        variant="secondary"
        tooltip={isPinned ? "Unpin" : "Pin"}
        onClick={onPin}
        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        {isPinned ? (
          <PinOff className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </TooltipIconButton>
      <TooltipIconButton
        size="icon"
        variant="secondary"
        tooltip="Generate prompt via chat"
        onClick={onChat}
        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <WandSparkles className="h-4 w-4" />
      </TooltipIconButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Persona
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyContext}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
