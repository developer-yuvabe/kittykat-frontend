import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

type InlineEditableFieldProps = {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  textClassName?: string;
  showLabel?: boolean;
  isTextarea?: boolean;
};

export function InlineEditableField({
  label,
  value,
  onSave,
  textClassName = "",
  showLabel = false,
  isTextarea = true,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value);

  const handleSave = async () => {
    try {
      onSave(inputVal);
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleCancel = () => {
    setInputVal(value);
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  return (
    <div className="flex items-start gap-2 w-full h-full pr-5">
      {showLabel && (
        <span className="font-bold whitespace-nowrap">{label}:</span>
      )}

      {isEditing ? (
        <div className="flex flex-1 h-full gap-2">
          {isTextarea ? (
            <Textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 h-full resize-none"
            />
          ) : (
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="inline-flex group items-center gap-1 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          <span className={textClassName}>{value}</span>
          <div className="relative w-4 h-4">
            {
              <TooltipIconButton
                tooltip="Edit"
                size={"xs"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick();
                }}
                className="absolute inset-0 flex items-center justify-center p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
              >
                <Pencil />
              </TooltipIconButton>
            }
          </div>
        </div>
      )}
    </div>
  );
}
