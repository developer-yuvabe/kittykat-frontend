"use client";
import { useState } from "react";
import { Pencil, Save } from "lucide-react";

interface EditableInputProps {
  value: string;
  onSave: (newValue: string) => void;
}

export default function EditableInput({ value, onSave }: EditableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onSave(tempValue.trim());
    setIsEditing(false);
  };

  return (
    <div className="flex items-center border rounded-md px-3 py-2 min-w-[200px] w-[250px]">
      {isEditing ? (
        <>
          <input
            className="flex-1 outline-none text-sm font-medium bg-transparent"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
          />
          <button
            onClick={handleSave}
            className="ml-2 text-gray-800 hover:text-gray-900"
          >
            <Save size={16} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-semibold truncate">
            {value || "Untitled"}
          </span>
          <button
            onClick={() => {
              setTempValue(value);
              setIsEditing(true);
            }}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <Pencil size={16} />
          </button>
        </>
      )}
    </div>
  );
}
