// Editable Title Component

import { Button } from "@/components/ui/button";
import { EditIcon, SaveIcon } from "@/components/ui/custom-icon";
import { Input } from "@/components/ui/input";
import { GalleryItemResponse } from "@/types/gallery.types";
import { useEffect, useRef, useState } from "react";

interface MediaItemEditableTitleProps {
  item: GalleryItemResponse;
  onUpdateTitle: (itemId: string, newTitle: string) => Promise<void>;
}

export function MediaItemEditableTitle({
  item,
  onUpdateTitle,
}: MediaItemEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.asset_title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onUpdateTitle(item.id, title);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving title:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(item.asset_title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div onDoubleClick={() => !isEditing && handleEdit()} className="relative">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="disabled:opacity-100 pr-8"
        onKeyDown={handleKeyDown}
        disabled={!isEditing || isSaving}
      />
      <Button
        variant="ghost"
        className="h-8 w-8 absolute top-1/2 -translate-y-1/2 right-0 hover:bg-transparent resize-none min-h-max"
        onClick={() => (isEditing ? handleSave() : handleEdit())}
        disabled={isSaving}
      >
        {isSaving ? (
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        ) : isEditing ? (
          <SaveIcon size={18} />
        ) : (
          <EditIcon size={18} />
        )}
      </Button>
    </div>
  );
}
