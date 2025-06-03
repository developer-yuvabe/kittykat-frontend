import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Pencil, Plus, X } from "lucide-react";
import { useStreamContext } from "@/providers/langgraph/Stream";

type InlineEditableBadgesProps = {
  label?: string;
  values: string[];
  onSave: (newValues: string[]) => Promise<void>;
  showLabel?: boolean;
};

export function InlineEditableBadges({
  label,
  values,
  onSave,
  showLabel = false,
}: InlineEditableBadgesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBadge, setNewBadge] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingValues, setEditingValues] = useState<string[]>([]);
  const { isLoading } = useStreamContext();

  useEffect(() => {
    if (submitted && !isLoading) {
      setIsSaving(false);
      setSubmitted(false);
      setIsEditing(false);
      setIsAddingNew(false);
    }
  }, [isLoading, submitted]);

  const handleSave = async () => {
    setIsSaving(true);
    setSubmitted(true);
    try {
      await onSave(editingValues);
    } catch (err) {
      console.error("Failed to save badges", err);
      setIsSaving(false);
      setSubmitted(false);
    }
  };

  const handleCancel = () => {
    setEditingValues([]);
    setIsEditing(false);
    setNewBadge("");
    setIsAddingNew(false);
  };

  const handleStartEditing = () => {
    setEditingValues([...values]);
    setIsEditing(true);
  };

  const handleAddBadge = () => {
    if (newBadge.trim() !== "") {
      setEditingValues([...editingValues, newBadge.trim()]);
      setNewBadge("");
      setIsAddingNew(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddBadge();
    } else if (e.key === "Escape") {
      setNewBadge("");
      setIsAddingNew(false);
    }
  };

  const handleUpdateBadge = (index: number, newValue: string) => {
    const updated = [...editingValues];
    updated[index] = newValue;
    setEditingValues(updated);
  };

  const handleRemoveBadge = (index: number) => {
    const updated = editingValues.filter((_, i) => i !== index);
    setEditingValues(updated);
  };

  if (isSaving) {
    return (
      <div className="flex flex-col gap-2 w-full">
        {showLabel && label && (
          <span className="text-sm font-medium text-gray-700">{label}:</span>
        )}
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    );
  }

  const currentValues = isEditing ? editingValues : values;

  return (
    <div className="flex flex-col gap-2 w-full">
      {showLabel && label && (
        <span className="text-sm font-medium text-gray-700">{label}:</span>
      )}

      <div className="flex flex-wrap gap-2 items-center group">
        {/* Existing badges */}
        {currentValues.map((val, i) => (
          <div key={i} className="relative group/badge">
            {isEditing ? (
              <div className="relative inline-flex items-center">
                <Input
                  value={val}
                  onChange={(e) => handleUpdateBadge(i, e.target.value)}
                  className="h-7 text-xs pl-2 pr-6 min-w-[80px] w-auto"
                  style={{ width: `${Math.max(80, val.length * 8 + 16)}px` }}
                />
                <button
                  onClick={() => handleRemoveBadge(i)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Badge
                variant="outline"
                className="text-xs bg-purple-50 text-purple-700 border-purple-100"
                onDoubleClick={handleStartEditing}
              >
                <span>{val}</span>
              </Badge>
            )}
          </div>
        ))}

        {/* Add new badge input or button */}
        {isEditing && isAddingNew ? (
          <div className="flex items-center gap-1">
            <Input
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-7 text-xs px-2 w-32"
              placeholder="New badge..."
              autoFocus
              onBlur={() => {
                if (!newBadge.trim()) {
                  setIsAddingNew(false);
                }
              }}
            />
            <button
              onClick={handleAddBadge}
              className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-green-100 text-green-600 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : isEditing ? (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center justify-center w-7 h-7 rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : null}

        {/* Edit trigger when not editing - shows on container hover */}
        {!isEditing && (
          <button
            onClick={handleStartEditing}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Save/Cancel buttons */}
      {isEditing && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
