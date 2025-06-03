import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Pencil } from "lucide-react";
import { useStreamContext } from "@/providers/langgraph/Stream";
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
  const [isSaving, setIsSaving] = useState(false);
  const { isLoading } = useStreamContext();
  const [submitted, setSubmitted] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSubmitted(true);

    try {
      await onSave(inputVal);
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  useEffect(() => {
    if (submitted && !isLoading) {
      setIsSaving(false);
      setSubmitted(false);
    }
  }, [isLoading, submitted]);

  const handleCancel = () => {
    setInputVal(value);
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    if (!isSaving) setIsEditing(true);
  };

  const handleEditClick = () => {
    if (!isSaving) setIsEditing(true);
  };

  return (
    <div className="flex items-start gap-2 w-full">
      {showLabel && (
        <span className="font-bold whitespace-nowrap">{label}:</span>
      )}

      {isSaving ? (
        <Skeleton className="h-9 w-full rounded-md" />
      ) : isEditing ? (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {isTextarea ? (
            <Textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full"
              rows={4}
            />
          ) : (
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full"
            />
          )}
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button size="xs" variant="ghost" onClick={handleCancel}>
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
            <TooltipIconButton
              tooltip="Edit"
              size={"xs"}
              onClick={handleEditClick}
              className="absolute inset-0 flex items-center justify-center p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
            >
              <Pencil />
            </TooltipIconButton>
          </div>
        </div>
      )}
    </div>
  );
}
